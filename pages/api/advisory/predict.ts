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
    if (/tunnel website ahead|loca\.lt/i.test(text) || response.status === 511) {
      return {
        error:
          'localtunnel interstitial blocked advisory. Redeploy Vercel with tunnel bypass headers, keep named tunnel running.',
        detail: text.slice(0, 200),
      }
    }
    return {
      error:
        response.status === 404
          ? `Advisory API not found on ${backendBase()}. Start run_local_gpu.ps1 (needs /api/advisory/predict).`
          : `Backend returned non-JSON (${response.status}): ${text.slice(0, 160)}`,
      detail: text.slice(0, 300),
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const BACKEND_URL = backendBase()
  const url = new URL(`${BACKEND_URL}/api/advisory/predict`)
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
      body: req.method === 'POST' ? JSON.stringify(req.body || {}) : undefined,
    })
    const data = await readBody(response)
    return res.status(response.ok ? 200 : response.status === 404 ? 502 : response.status).json(
      response.ok
        ? data
        : {
            error: data.error || data.detail || `Advisory request failed (${response.status})`,
            detail: data.detail || data.error,
            backend: BACKEND_URL,
          }
    )
  } catch (error: any) {
    return res.status(502).json({
      error: error?.message || 'Advisory backend unreachable',
      backend: BACKEND_URL,
      hint: 'Start scripts/run_local_gpu.ps1 + start_tunnel_named.ps1, set NEXT_PUBLIC_API_URL to https://krishi-mithr-api.loca.lt',
    })
  }
}
