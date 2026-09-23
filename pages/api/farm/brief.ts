import type { NextApiRequest, NextApiResponse } from 'next'
import { COLLECTIONS, getDb } from '../../../src/lib/mongo'
import { localDateInTz, userIdFromRequest } from '../../../src/lib/farm-profile'
import { compareHourlyToProfile } from '../../../src/lib/sensor-hourly'
import { chatJson } from '../../../src/lib/gemini'
import { languageByCode } from '../../../src/lib/my-farm-schema'

async function weatherTomorrow(lat?: number | null, lon?: number | null, city?: string) {
  try {
    const params = new URLSearchParams()
    if (lat != null && lon != null) {
      params.set('lat', String(lat))
      params.set('lon', String(lon))
    } else {
      params.set('city', city || 'Hyderabad')
    }
    const url = `https://api.open-meteo.com/v1/forecast?${lat != null && lon != null ? `latitude=${lat}&longitude=${lon}` : 'latitude=17.385&longitude=78.4867'}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&forecast_days=2&timezone=auto`
    const r = await fetch(url)
    if (!r.ok) return null
    const j = await r.json()
    const d = j.daily
    if (!d?.time?.[1]) return { date: d.time?.[0], tmax: d.temperature_2m_max?.[0], tmin: d.temperature_2m_min?.[0], rain: d.precipitation_sum?.[0], et0: d.et0_fao_evapotranspiration?.[0] }
    return { date: d.time[1], tmax: d.temperature_2m_max[1], tmin: d.temperature_2m_min[1], rain: d.precipitation_sum[1], et0: d.et0_fao_evapotranspiration[1] }
  } catch {
    return null
  }
}

export async function generateBriefForUser(userId: string, force = false) {
  const db = await getDb()
  const profile = await db.collection(COLLECTIONS.farmProfiles).findOne({ farmer_id: userId, setupComplete: true })
  if (!profile) return null
  const tz = profile.timezone || 'Asia/Kolkata'
  const date = localDateInTz(new Date(), tz)
  const existing = await db.collection(COLLECTIONS.dailyBriefs).findOne({ farmer_id: userId, field_id: profile.field_id, date })
  if (existing && !force) {
    const { _id, ...rest } = existing
    return rest
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const hours = await db
    .collection(COLLECTIONS.sensorHourly)
    .find({ farmer_id: userId, field_id: profile.field_id, hour_start: { $gte: since } })
    .sort({ hour_start: 1 })
    .toArray()
  const events = await db
    .collection(COLLECTIONS.sensorEvents)
    .find({ farmer_id: userId, field_id: profile.field_id, timestamp: { $gte: since } })
    .sort({ timestamp: -1 })
    .limit(20)
    .toArray()
  const previous = await db
    .collection(COLLECTIONS.dailyBriefs)
    .find({ farmer_id: userId, field_id: profile.field_id, date: { $ne: date } })
    .sort({ date: -1 })
    .limit(1)
    .next()
  const weather = await weatherTomorrow(profile.location?.lat, profile.location?.lon)
  const comparison = compareHourlyToProfile(profile, hours)
  const lang = languageByCode(profile.language)
  let camera: Record<string, unknown> | null = null
  try {
    const scan = await db.collection('camera_scans').findOne(
      {},
      { sort: { timestamp: -1 }, projection: { annotated_image: 0, leaves: 0, pests: 0 } }
    )
    if (scan) {
      const { _id, ...rest } = scan
      camera = {
        summary: rest.summary,
        certainty: rest.certainty,
        advice: rest.advice,
        findings: rest.findings,
        timestamp: rest.timestamp,
        device_id: rest.device_id,
      }
    }
  } catch {
    camera = null
  }
  let liveSensor: Record<string, unknown> | null = null
  try {
    const row = await db.collection(COLLECTIONS.sensorReadings).findOne(
      { device_id: profile.deviceId || 'esp32_goa' },
      { sort: { timestamp: -1 } }
    )
    if (row) {
      liveSensor = {
        temperature: row.temperature,
        humidity: row.humidity,
        soil_moisture: row.soil_moisture ?? row.soilMoisture,
        TDS: row.TDS ?? row.tds_ppm,
        motor_on: row.motor_on ?? row.motor,
        timestamp: row.timestamp,
      }
    }
  } catch {
    liveSensor = null
  }
  const slimHours = hours.map((h) => ({
    start: h.hour_start,
    soil: h.soil_moisture,
    temp: h.temperature,
    hum: h.humidity,
    tds: h.tds,
    rain: h.rain_detections,
    motor_on: h.motor_on_events,
    missing_min: h.missing_minutes,
    n: h.valid_readings,
  }))

  const llm = await chatJson(
    `You are the Krishi Mithr field advisor. Write in ${lang.name} (${lang.code}), native script.
The farmer already finished the My Farm survey. Recommendations MUST combine:
1) the farm survey (crop, stage, soil, irrigation, location),
2) ESP sensor numbers,
3) the latest leaf/camera diagnose if present,
4) weather.
Do not invent a disease from weather alone if there is no photo finding. Do not invent irrigation litres. If a source is missing, list it in missing[]. JSON only.`,
    `Farm survey: ${JSON.stringify({
      fieldName: profile.fieldName,
      crop: profile.crop,
      variety: profile.variety,
      stage: profile.growthStage,
      soil: profile.soilType,
      irrigation: profile.irrigationMethod,
      sown: profile.sowing,
      location: profile.location,
    })}
Live ESP sensors: ${JSON.stringify(liveSensor)}
Comparison vs crop/stage moisture band: ${JSON.stringify(comparison)}
Last 24 hourly summaries: ${JSON.stringify(slimHours)}
Events: ${JSON.stringify(events.map(({ _id, ...e }) => e))}
Latest camera diagnose: ${JSON.stringify(camera)}
Tomorrow weather: ${JSON.stringify(weather)}
Yesterday headline: ${previous?.headline || 'none'}

Return {"headline":"","today":"","attention":[],"tomorrow":[],"missing":[]}`,
    0.3,
    1200
  )

  const brief = {
    farmer_id: userId,
    field_id: profile.field_id,
    date,
    language: profile.language,
    ...llm,
    comparison,
    weather,
    camera,
    liveSensor,
    generated_at: new Date(),
    model: 'gemini-2.5-flash-lite',
  }
  await db.collection(COLLECTIONS.dailyBriefs).updateOne(
    { farmer_id: userId, field_id: profile.field_id, date },
    { $set: brief },
    { upsert: true }
  )
  return brief
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = userIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    if (req.method === 'GET') {
      const force = req.query.refresh === '1'
      const brief = await generateBriefForUser(userId, force)
      if (!brief) return res.status(200).json({ brief: null, message: 'Complete farm setup first' })
      return res.status(200).json({ brief })
    }
    if (req.method === 'POST') {
      const brief = await generateBriefForUser(userId, true)
      return res.status(200).json({ brief })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('[farm/brief]', error?.message || error)
    return res.status(502).json({ error: error?.message || 'Brief failed' })
  }
}
