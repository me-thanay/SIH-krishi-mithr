import { NextApiRequest, NextApiResponse } from 'next'

function backendBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).trim()
  let url = raw.replace(/\/$/, '')
  if (url.startsWith('http://') && /(onrender\.com|ngrok|trycloudflare\.com|loca\.lt)/i.test(url)) {
    url = url.replace(/^http:\/\//, 'https://')
  }
  return url
}

function tunnelHeaders(): Record<string, string> {
  const base = backendBase()
  const headers: Record<string, string> = { accept: 'application/json' }
  if (/ngrok/i.test(base)) headers['ngrok-skip-browser-warning'] = 'true'
  if (/loca\.lt/i.test(base)) headers['bypass-tunnel-reminder'] = 'true'
  return headers
}

/** Hardcoded demo row from the old fallback — never show this as live ESP data. */
function isFakeDemoRow(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  return (
    Number(data.temperature) === 34 &&
    Number(data.humidity) === 68 &&
    Number(data.soil_moisture ?? data.soilMoisture) === 18 &&
    Number(data.TDS ?? data.tds_ppm) === 950
  )
}

async function fetchMqttLive(): Promise<{ data: any; source: string } | null> {
  const base = backendBase()
  if (!base) return null
  try {
    const r = await fetch(`${base}/api/mqtt/latest-sensor`, {
      headers: tunnelHeaders(),
    })
    if (!r.ok) return null
    const j = await r.json()
    if (j?.data && !isFakeDemoRow(j.data)) {
      return { data: j.data, source: j.source || 'mqtt_live' }
    }
  } catch (e) {
    console.warn('[sensor-data] FastAPI MQTT fetch failed', e)
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const empty = (message: string) =>
    res.status(200).json({
      data: null,
      updated: false,
      mock: false,
      message,
      timestamp: new Date().toISOString(),
    })

  try {
    const live = await fetchMqttLive()
    if (live) {
      return res.status(200).json({
        data: live.data,
        updated: true,
        mock: false,
        source: live.source,
        timestamp: live.data.timestamp || new Date().toISOString(),
        available_fields: Object.keys(live.data),
        missing_fields: [],
      })
    }
    return empty('Waiting for Goa ESP32 MQTT. Keep FastAPI + tunnel running; Serial should say Published successfully.')
  } catch (error: any) {
    console.error('Error fetching sensor data:', error?.message || error)
    return empty('Sensor backend unreachable — start run_local_gpu.ps1 and the tunnel.')
  }
}
