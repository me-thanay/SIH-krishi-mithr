import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: '16mb',
  },
  // Pro/Enterprise only beyond 60s; browser often calls the tunnel/Render URL directly.
  maxDuration: 300,
}

function backendBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).trim()
  let url = raw.replace(/\/$/, '')
  if (
    url.startsWith('http://') &&
    /(onrender\.com|ngrok|trycloudflare\.com|cloudflaretunnel|loca\.lt)/i.test(url)
  ) {
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

  const headers: Record<string, string> = {
    accept: 'application/json',
  }
  if (req.headers['content-type']) {
    headers['content-type'] = String(req.headers['content-type'])
  }
  if (/ngrok/i.test(base)) {
    headers['ngrok-skip-browser-warning'] = 'true'
  }
  if (/loca\.lt/i.test(base)) {
    headers['bypass-tunnel-reminder'] = 'true'
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
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
      detail: `Could not reach ${base}. Start scripts/run_local_gpu.ps1 + a tunnel (or Render), set NEXT_PUBLIC_API_URL to that HTTPS URL on Vercel.`,
      backend: base,
    })
  }
}
