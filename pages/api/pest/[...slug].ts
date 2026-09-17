import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: "16mb",
  },
  // Fallback if the browser still hits this proxy instead of Render directly.
  maxDuration: 60,
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug
  const path = Array.isArray(slug) ? slug.join('/') : slug || ''
  const queryIndex = req.url?.indexOf('?') ?? -1
  const search = queryIndex >= 0 ? req.url!.slice(queryIndex) : ''
  const url = `${BACKEND_URL}/api/pest/${path}${search}`

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...(req.headers['content-type'] ? { 'content-type': String(req.headers['content-type']) } : {}),
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    })
    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type')
    if (contentType) res.setHeader('content-type', contentType)
    return res.status(response.status).send(buffer)
  } catch (error: any) {
    return res.status(502).json({
      success: false,
      error: error?.message || 'Leaf diagnosis backend is unreachable',
    })
  }
}
