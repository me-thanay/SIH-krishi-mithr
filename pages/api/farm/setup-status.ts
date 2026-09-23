import type { NextApiRequest, NextApiResponse } from 'next'
import { COLLECTIONS, getDb, mongoUri } from '../../../src/lib/mongo'
import { getLocalFarmProfile } from '../../../src/lib/farm-local-store'
import { userIdFromRequest } from '../../../src/lib/farm-profile'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const userId = userIdFromRequest(req)
  if (!userId) return res.status(200).json({ setupComplete: false, authenticated: false })
  try {
    if (mongoUri()) {
      const db = await getDb()
      const profile = await db.collection(COLLECTIONS.farmProfiles).findOne({ farmer_id: userId })
      if (profile) {
        return res.status(200).json({
          authenticated: true,
          setupComplete: Boolean(profile.setupComplete),
          hasDraft: Boolean(profile.draft?.answers),
          fieldName: profile.fieldName || null,
        })
      }
    }
  } catch {
    /* local fallback */
  }
  const local = getLocalFarmProfile(userId)
  return res.status(200).json({
    authenticated: true,
    setupComplete: Boolean(local?.setupComplete),
    hasDraft: Boolean(local?.draft?.answers),
    fieldName: local?.fieldName || null,
  })
}
