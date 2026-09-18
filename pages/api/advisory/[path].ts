import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = typeof req.query.path === 'string' ? req.query.path : 'predict'
  const url = new URL(`${BACKEND_URL.replace(/\/$/, '')}/api/advisory/${path}`)

  if (req.method === 'GET') {
    for (const key of ['city', 'lat', 'lon'] as const) {
      const value = req.query[key]
      if (typeof value === 'string' && value) url.searchParams.set(key, value)
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: { 'content-type': 'application/json' },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body || {}),
    })
    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (error: any) {
    return res.status(502).json({
      error: error?.message || 'Advisory backend unreachable',
    })
  }
}
