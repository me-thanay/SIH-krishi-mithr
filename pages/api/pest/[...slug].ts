import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: '16mb',
  },
  maxDuration: 60,
}

function backendBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).trim()
  let url = raw.replace(/\/$/, '')
  // Avoid mixed-content / broken localhost in production builds
  if (url.startsWith('http://') && url.includes('onrender.com')) {
    url = url.replace(/^http:\/\//, 'https://')
  }
  return url
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug
  const path = Array.isArray(slug) ? slug.join('/') : slug || ''
  const queryIndex = req.url?.indexOf('?') ?? -1
  const search = queryIndex >= 0 ? req.url!.slice(queryIndex) : ''
  const base = backendBase()
  const url = `${base}/api/pest/${path}${search}`

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...(req.headers['content-type'] ? { 'content-type': String(req.headers['content-type']) } : {}),
        accept: 'application/json',
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    })
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type')
    if (contentType) res.setHeader('content-type', contentType)
    return res.status(response.status).send(buffer)
  } catch (error: any) {
    const message = error?.message || 'Leaf diagnosis backend is unreachable'
    return res.status(502).json({
      success: false,
      error: message,
      detail: `Could not reach ${base}. Wake/redeploy Render and set NEXT_PUBLIC_API_URL to that HTTPS URL on Vercel.`,
      backend: base,
    })
  }
}
