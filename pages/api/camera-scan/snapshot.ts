import type { NextApiRequest, NextApiResponse } from 'next'
import { PHONE_SNAPSHOT_URL } from '../../../src/lib/phone-webcam'

export const config = {
  api: {
    responseLimit: '8mb',
  },
}

function backendBase(): string {
  const raw = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '').trim()
  let url = raw.replace(/\/$/, '')
  if (url.startsWith('http://') && /(onrender\.com|ngrok|trycloudflare\.com|loca\.lt)/i.test(url)) {
    url = url.replace(/^http:\/\//, 'https://')
  }
  return url
}

async function fetchJpeg(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'image/jpeg,image/*,*/*' },
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json') || contentType.includes('text/html')) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 32) return null
    return { buffer, contentType: contentType || 'image/jpeg' }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const t = Date.now()
  const candidates = [
    `${PHONE_SNAPSHOT_URL}?t=${t}`,
    `${backendBase()}/api/pest/phone-snapshot?t=${t}`,
    `http://127.0.0.1:8000/api/pest/phone-snapshot?t=${t}`,
  ].filter((u, i, arr) => u.startsWith('http') && arr.indexOf(u) === i)

  for (const url of candidates) {
    const hit = await fetchJpeg(url)
    if (!hit) continue
    res.setHeader('Content-Type', hit.contentType)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res.status(200).send(hit.buffer)
  }

  return res.status(502).json({
    error: 'Failed to fetch image from phone IP Webcam app. Make sure the server is running.',
    url: PHONE_SNAPSHOT_URL,
  })
}
