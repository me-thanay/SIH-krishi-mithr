import type { NextApiRequest, NextApiResponse } from 'next'

function backendBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).trim()
  let url = raw.replace(/\/$/, '')
  if (
    url.startsWith('http://') &&
    /(onrender\.com|ngrok|trycloudflare\.com|loca\.lt)/i.test(url)
  ) {
    url = url.replace(/^http:\/\//, 'https://')
  }
  return url
}

function forwardHeaders(): Record<string, string> {
  const base = backendBase()
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  }
  if (/ngrok/i.test(base)) headers['ngrok-skip-browser-warning'] = 'true'
  if (/loca\.lt/i.test(base)) headers['bypass-tunnel-reminder'] = 'true'
  return headers
}

async function readBody(response: Response): Promise<any> {
  const text = await response.text()
  if (!text) return { error: `Empty response (${response.status})` }
  try {
    return JSON.parse(text)
  } catch {
    return {
      error:
        response.status === 404
          ? `Advisory route missing on backend (${backendBase()}).`
          : `Backend returned non-JSON (${response.status}): ${text.slice(0, 160)}`,
    }
  }
}

/** Fallback proxy: /api/advisory/[path] -> FastAPI /api/advisory/{path} */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const BACKEND_URL = backendBase()
  const path = typeof req.query.path === 'string' ? req.query.path : 'predict'
  const url = new URL(`${BACKEND_URL}/api/advisory/${path}`)

  if (req.method === 'GET') {
    for (const key of ['city', 'lat', 'lon'] as const) {
      const value = req.query[key]
      if (typeof value === 'string' && value) url.searchParams.set(key, value)
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: forwardHeaders(),
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body || {}),
    })
    const data = await readBody(response)
    if (!response.ok) {
      return res.status(response.status === 404 ? 502 : response.status).json({
        error: data.error || data.detail || `Advisory failed (${response.status})`,
        backend: BACKEND_URL,
      })
    }
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(502).json({
      error: error?.message || 'Advisory backend unreachable',
      backend: BACKEND_URL,
    })
  }
}
