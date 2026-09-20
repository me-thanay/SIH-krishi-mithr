import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Reverse-geocode browser GPS into village / district / state.
 * Uses OpenStreetMap Nominatim (free, needs a User-Agent, so it runs server-side).
 *   GET /api/my-farm/geocode?lat=17.38&lon=78.48
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const lat = Number(req.query.lat)
  const lon = Number(req.query.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon are required numbers' })
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&addressdetails=1&accept-language=en&lat=${lat}&lon=${lon}`
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'KrishiMithr/1.0 (farm field registration; contact via GitHub me-thanay/SIH-krishi-mithr)',
        Accept: 'application/json',
      },
    })
    if (!r.ok) {
      return res.status(502).json({ error: `Geocoder returned ${r.status}` })
    }
    const j = await r.json()
    const a = j?.address || {}
    const village =
      a.village || a.hamlet || a.town || a.suburb || a.neighbourhood || a.city_district || a.city || a.municipality || ''
    const district = a.state_district || a.district || a.county || ''
    const state = a.state || ''
    return res.status(200).json({
      lat,
      lon,
      village,
      district,
      state,
      country: a.country || '',
      display: j?.display_name || [village, district, state].filter(Boolean).join(', '),
    })
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'Reverse geocoding failed' })
  }
}
