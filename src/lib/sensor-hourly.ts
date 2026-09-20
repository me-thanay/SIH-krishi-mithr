import { COLLECTIONS, getDb } from './mongo'
import { hourStartUtc, localDateInTz, moistureBand } from './farm-profile'

const METRICS = ['soil_moisture', 'temperature', 'humidity', 'tds'] as const

function finite(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}

function readingId(doc: Record<string, any>): string {
  const ts = doc.timestamp
  const iso = ts instanceof Date ? ts.toISOString() : String(ts || '')
  return `${doc.device_id || ''}|${iso}|${doc.soil_moisture ?? doc.soilMoisture ?? ''}|${doc.temperature ?? ''}`
}

function metricValues(doc: Record<string, any>): Record<(typeof METRICS)[number], number | null> {
  const soil = finite(doc.soil_moisture ?? doc.soilMoisture)
  const temp = finite(doc.temperature)
  const hum = finite(doc.humidity)
  const tds = finite(doc.TDS ?? doc.tds_ppm)
  return {
    soil_moisture: soil,
    temperature: temp === 0 && hum === 0 ? null : temp, // DHT fail in Goa firmware publishes 0/0
    humidity: temp === 0 && hum === 0 ? null : hum,
    tds,
  }
}

export async function rollHourlyFromReading(doc: Record<string, any>): Promise<void> {
  const db = await getDb()
  const deviceId = String(doc.device_id || 'esp32_goa')
  const profiles = await db
    .collection(COLLECTIONS.farmProfiles)
    .find({ setupComplete: true, $or: [{ deviceId }, { deviceId: { $exists: false } }] })
    .sort({ updatedAt: -1 })
    .limit(8)
    .toArray()
  const targets = profiles.length
    ? profiles.filter((p) => !p.deviceId || p.deviceId === deviceId)
    : []
  if (!targets.length) return

  const ts = doc.timestamp instanceof Date ? doc.timestamp : new Date(doc.timestamp || Date.now())
  const hour = hourStartUtc(ts)
  const hourEnd = new Date(hour.getTime() + 60 * 60 * 1000)
  const rid = readingId(doc)
  const values = metricValues(doc)
  const rain = finite(doc.raindata ?? doc.rain_status)
  const motorOn = doc.motor_on === true || doc.motor === true
  const valid = METRICS.some((k) => values[k] != null)

  for (const profile of targets) {
    const farmer_id = String(profile.farmer_id || profile.userId)
    const field_id = String(profile.field_id || profile._id)
    const tz = profile.timezone || 'Asia/Kolkata'
    const cycle = Array.isArray(profile.cropCycles) ? profile.cropCycles[profile.cropCycles.length - 1] : null
    const filter = { farmer_id, field_id, hour_start: hour }

    const existing = await db.collection(COLLECTIONS.sensorHourly).findOne(filter)
    if (existing?.last_reading_id === rid) continue

    const inc: Record<string, number> = { valid_readings: valid ? 1 : 0, sample_count: 1 }
    const setOnInsert: Record<string, unknown> = {
      farmer_id,
      field_id,
      device_id: deviceId,
      hour_start: hour,
      hour_end: hourEnd,
      date: localDateInTz(ts, tz),
      timezone: tz,
      crop: cycle?.crop || profile.crop || null,
      crop_cycle_id: cycle?.id || null,
      rain_detections: 0,
      motor_on_events: 0,
      motor_off_events: 0,
      missing_minutes: 0,
      createdAt: new Date(),
    }
    const set: Record<string, unknown> = {
      last_reading_id: rid,
      last_seen: ts,
      updatedAt: new Date(),
    }

    for (const key of METRICS) {
      const v = values[key]
      if (v == null) continue
      inc[`${key}.n`] = 1
      inc[`${key}.sum`] = v
      const prevMin = existing?.[key]?.min
      const prevMax = existing?.[key]?.max
      set[`${key}.min`] = prevMin == null ? v : Math.min(prevMin, v)
      set[`${key}.max`] = prevMax == null ? v : Math.max(prevMax, v)
      const n = (existing?.[key]?.n || 0) + 1
      const sum = (existing?.[key]?.sum || 0) + v
      set[`${key}.avg`] = Math.round((sum / n) * 10) / 10
    }

    const lastSeen = existing?.last_seen ? new Date(existing.last_seen) : null
    if (lastSeen) {
      const gapMin = (ts.getTime() - lastSeen.getTime()) / 60000
      if (gapMin > 12) inc.missing_minutes = Math.round(gapMin)
    }

    if (rain != null && rain >= 20) inc.rain_detections = 1

    const prevMotor = existing?.last_motor_on
    if (typeof prevMotor === 'boolean' && prevMotor !== motorOn) {
      if (motorOn) inc.motor_on_events = 1
      else inc.motor_off_events = 1
      await db.collection(COLLECTIONS.sensorEvents).insertOne({
        farmer_id,
        field_id,
        type: motorOn ? 'motor_on' : 'motor_off',
        timestamp: ts,
        payload: { soil_moisture: values.soil_moisture, tds: values.tds },
      })
    }
    if (rain != null && rain >= 20) {
      await db.collection(COLLECTIONS.sensorEvents).insertOne({
        farmer_id,
        field_id,
        type: 'rain',
        timestamp: ts,
        payload: { rain },
      })
    }
    set.last_motor_on = motorOn

    await db.collection(COLLECTIONS.sensorHourly).updateOne(
      filter,
      { $setOnInsert: setOnInsert, $set: set, $inc: inc },
      { upsert: true }
    )
  }
}

export function compareHourlyToProfile(profile: any, hours: any[]) {
  const band = moistureBand(profile?.crop, profile?.growthStage)
  const soils = hours.map((h) => h.soil_moisture?.avg).filter((n: unknown) => typeof n === 'number') as number[]
  const avgSoil = soils.length ? soils.reduce((a, b) => a + b, 0) / soils.length : null
  const minSoil = soils.length ? Math.min(...soils) : null
  const maxSoil = soils.length ? Math.max(...soils) : null
  const dryHours = hours.filter((h) => typeof h.soil_moisture?.avg === 'number' && h.soil_moisture.avg < band.min).length
  const wetHours = hours.filter((h) => typeof h.soil_moisture?.avg === 'number' && h.soil_moisture.avg > band.max).length
  const motorOn = hours.reduce((n, h) => n + (h.motor_on_events || 0), 0)
  const rainHits = hours.reduce((n, h) => n + (h.rain_detections || 0), 0)
  const missing = hours.reduce((n, h) => n + (h.missing_minutes || 0), 0)
  const samples = hours.reduce((n, h) => n + (h.valid_readings || 0), 0)
  return {
    moisture_band: band,
    soil_avg: avgSoil == null ? null : Math.round(avgSoil),
    soil_min: minSoil,
    soil_max: maxSoil,
    dry_hours: dryHours,
    wet_hours: wetHours,
    motor_on_events: motorOn,
    rain_detections: rainHits,
    missing_minutes: missing,
    valid_readings: samples,
    hours_covered: hours.length,
    irrigation_recent: motorOn > 0,
    soil_vs_band:
      avgSoil == null ? 'unknown' : avgSoil < band.min ? 'drier_than_typical' : avgSoil > band.max ? 'wetter_than_typical' : 'in_range',
  }
}
