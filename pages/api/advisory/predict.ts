import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'
).replace(/\/$/, '')

async function readBody(response: Response): Promise<any> {
  const text = await response.text()
  if (!text) return { error: `Empty response (${response.status})` }
  try {
    return JSON.parse(text)
  } catch {
    return {
      error:
        response.status === 404
          ? `Advisory API not found on ${BACKEND_URL}. Redeploy Render with latest main (needs /api/advisory/predict).`
          : `Backend returned non-JSON (${response.status}): ${text.slice(0, 160)}`,
      detail: text.slice(0, 300),
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
      headers: { 'content-type': 'application/json', accept: 'application/json' },
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
      hint: 'Start FastAPI locally or set NEXT_PUBLIC_API_URL to your Render URL, then redeploy Vercel.',
    })
  }
}
