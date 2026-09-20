import type { NextApiRequest, NextApiResponse } from 'next'
import { COLLECTIONS, getDb, mongoUri } from '../../../src/lib/mongo'
import { userIdFromRequest } from '../../../src/lib/farm-profile'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const userId = userIdFromRequest(req)
  if (!userId) return res.status(200).json({ setupComplete: false, authenticated: false })
  if (!mongoUri()) return res.status(200).json({ setupComplete: false, authenticated: true })
  try {
    const db = await getDb()
    const profile = await db.collection(COLLECTIONS.farmProfiles).findOne({ farmer_id: userId })
    return res.status(200).json({
      authenticated: true,
      setupComplete: Boolean(profile?.setupComplete),
      hasDraft: Boolean(profile?.draft?.answers),
      fieldName: profile?.fieldName || null,
    })
  } catch {
    return res.status(200).json({ setupComplete: false, authenticated: true })
  }
}
