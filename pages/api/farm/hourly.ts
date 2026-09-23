import type { NextApiRequest, NextApiResponse } from 'next'
import { COLLECTIONS, getDb } from '../../../src/lib/mongo'
import { userIdFromRequest } from '../../../src/lib/farm-profile'
import { compareHourlyToProfile } from '../../../src/lib/sensor-hourly'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const userId = userIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const hours = Number(req.query.hours || 24)
    const db = await getDb()
    const profile = await db.collection(COLLECTIONS.farmProfiles).findOne({ farmer_id: userId })
    if (!profile) return res.status(200).json({ hours: [], comparison: null, profile: null })
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const rows = await db
      .collection(COLLECTIONS.sensorHourly)
      .find({ farmer_id: userId, field_id: profile.field_id, hour_start: { $gte: since } })
      .sort({ hour_start: 1 })
      .toArray()
    const events = await db
      .collection(COLLECTIONS.sensorEvents)
      .find({ farmer_id: userId, field_id: profile.field_id, timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(40)
      .toArray()
    return res.status(200).json({
      profile: {
        setupComplete: Boolean(profile.setupComplete),
        fieldName: profile.fieldName,
        crop: profile.crop,
        growthStage: profile.growthStage,
        soilType: profile.soilType,
        irrigationMethod: profile.irrigationMethod,
        sowing: profile.sowing,
        location: profile.location,
      },
      hours: rows.map(({ _id, ...rest }) => rest),
      events: events.map(({ _id, ...rest }) => rest),
      comparison: compareHourlyToProfile(profile, rows),
    })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to load hourly summaries' })
  }
}
