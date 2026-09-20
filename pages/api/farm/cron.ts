import type { NextApiRequest, NextApiResponse } from 'next'
import { COLLECTIONS, getDb } from '../../../src/lib/mongo'
import { generateBriefForUser } from './brief'

/**
 * Nightly (or on-demand) brief for every completed farm profile.
 * Vercel cron: GET /api/farm/cron  (optional CRON_SECRET header)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const db = await getDb()
    const profiles = await db.collection(COLLECTIONS.farmProfiles).find({ setupComplete: true }).toArray()
    const results: { farmer_id: string; ok: boolean; error?: string }[] = []
    for (const p of profiles) {
      try {
        await generateBriefForUser(String(p.farmer_id), true)
        results.push({ farmer_id: String(p.farmer_id), ok: true })
      } catch (e: any) {
        results.push({ farmer_id: String(p.farmer_id), ok: false, error: e?.message })
      }
    }
    return res.status(200).json({ ran: results.length, results })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'cron failed' })
  }
}
