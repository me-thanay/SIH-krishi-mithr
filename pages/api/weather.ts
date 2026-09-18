import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

/**
 * Unified weather proxy for Pages Router callers:
 *   /api/weather?type=current&city=Mumbai
 *   /api/weather?type=forecast&lat=17.38&lon=78.48&days=5
 *   /api/weather?type=soil&city=Hyderabad
 *   /api/weather?type=hourly&city=Pune&hours=24
 *   /api/weather?type=alerts&city=Delhi
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const type = String(req.query.type || 'current')
  const allowed = new Set(['current', 'forecast', 'hourly', 'soil', 'alerts'])
  if (!allowed.has(type)) {
    return res.status(400).json({ error: `Unknown type '${type}'` })
  }

  const params = new URLSearchParams()
  for (const key of ['city', 'lat', 'lon', 'days', 'hours'] as const) {
    const value = req.query[key]
    if (typeof value === 'string' && value) params.set(key, value)
  }

  const url = `${BACKEND_URL.replace(/\/$/, '')}/api/weather/${type}${
    params.toString() ? `?${params.toString()}` : ''
  }`

  try {
    const response = await fetch(url)
    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    // Shape expected by some voice / FAB helpers
    if (type === 'current') {
      return res.status(200).json({
        success: true,
        data: {
          current: {
            temperature: { current: data.temperature },
            humidity: data.humidity,
            condition: data.description,
            farming_conditions: data.farming_conditions,
            ...data,
          },
          source: data.source || 'Open-Meteo',
          location: data.city,
        },
        ...data,
      })
    }

    if (type === 'forecast') {
      return res.status(200).json({
        success: true,
        data,
        source: data.source || 'Open-Meteo',
      })
    }

    return res.status(200).json({ success: true, data, ...data })
  } catch (error: any) {
    return res.status(502).json({
      success: false,
      error: error?.message || 'Weather backend unreachable',
    })
  }
}
