import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Fallback text-to-speech for Indian languages that desktop browsers cannot speak
 * (Chrome/Edge on Windows ship no Telugu, Tamil, Kannada... voices).
 *   GET /api/my-farm/tts?lang=te-IN&q=<text>
 * Returns audio/mpeg. Uses Google Translate's public TTS endpoint; the client falls
 * back to the browser voice if this fails.
 */

const MAX_CHUNK = 180

function chunkText(text: string): string[] {
  const out: string[] = []
  const sentences = text.split(/(?<=[.!?।॥\n])\s+/)
  let cur = ''
  for (const s of sentences) {
    if (!s) continue
    if ((cur + ' ' + s).trim().length <= MAX_CHUNK) {
      cur = (cur + ' ' + s).trim()
      continue
    }
    if (cur) out.push(cur)
    if (s.length <= MAX_CHUNK) {
      cur = s
    } else {
      // long sentence: break on words
      let piece = ''
      for (const w of s.split(/\s+/)) {
        if ((piece + ' ' + w).trim().length > MAX_CHUNK) {
          if (piece) out.push(piece)
          piece = w
        } else {
          piece = (piece + ' ' + w).trim()
        }
      }
      cur = piece
    }
  }
  if (cur) out.push(cur)
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const q = String(req.query.q || '').trim()
  const lang = String(req.query.lang || 'en-IN')
  if (!q) return res.status(400).json({ error: 'q is required' })
  if (q.length > 1500) return res.status(413).json({ error: 'text too long' })

  const tl = lang.split('-')[0].toLowerCase()
  try {
    const buffers: Buffer[] = []
    for (const chunk of chunkText(q)) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(chunk)}`
      const r = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      })
      if (!r.ok) throw new Error(`tts upstream ${r.status}`)
      buffers.push(Buffer.from(await r.arrayBuffer()))
    }
    const audio = Buffer.concat(buffers)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', String(audio.length))
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return res.status(200).send(audio)
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'tts failed' })
  }
}
