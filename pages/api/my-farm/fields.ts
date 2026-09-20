import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { FARM_QUESTIONS, type Answers, type DetectedLocation } from '../../../src/lib/my-farm-schema'

/**
 * My Farm fields — MongoDB `farm_fields` collection.
 *   GET  /api/my-farm/fields?clientId=...          list fields for the signed-in user or this device
 *   POST /api/my-farm/fields                        save a new field
 *   PUT  /api/my-farm/fields?id=...                 replace answers of an existing field
 */

const DB_NAME = process.env.MONGODB_DB || 'krishi-mithr'
const COLLECTION = 'farm_fields'

function userIdFromRequest(req: NextApiRequest): string | null {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  try {
    const decoded = jwt.verify(header.substring(7), process.env.JWT_SECRET || 'fallback-secret-key') as {
      userId?: string
    }
    return decoded?.userId || null
  } catch {
    return null
  }
}

async function withDb<T>(fn: (db: import('mongodb').Db) => Promise<T>): Promise<T> {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI
  if (!uri || !uri.startsWith('mongodb')) {
    throw new Error('DATABASE_URL (MongoDB) is not configured')
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
  await client.connect()
  try {
    return await fn(client.db(DB_NAME))
  } finally {
    await client.close()
  }
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}

/** Flatten questionnaire answers into a queryable document. */
function structureAnswers(answers: Answers, detected?: DetectedLocation | null) {
  const a = (id: string) => answers?.[id]
  const d = (id: string) => (a(id)?.details || {}) as Record<string, any>
  const loc = d('location')
  return {
    fieldName: a('field_name')?.value || null,
    crop: a('crop')?.value || null,
    cropLocal: d('crop').crop_local || null,
    variety: a('variety')?.unknown ? null : a('variety')?.value || null,
    location: {
      village: loc.village || detected?.village || null,
      district: loc.district || detected?.district || null,
      state: loc.state || detected?.state || null,
      confirmedGps: Boolean(loc.confirmed_gps),
      lat: detected?.lat ?? null,
      lon: detected?.lon ?? null,
      accuracyM: detected?.accuracy ?? null,
    },
    area: {
      value: num(d('area').number),
      unit: d('area').unit || null,
      unitLocal: d('area').unit_local || null,
      spoken: a('area')?.value || null,
    },
    sowing: {
      date: d('sowing').date_iso || null,
      approximate: Boolean(d('sowing').approximate),
      method: d('sowing').method || null,
      spoken: a('sowing')?.value || null,
    },
    growthStage: d('stage').stage || a('stage')?.value || null,
    soilType: a('soil')?.unknown ? null : d('soil').soil || a('soil')?.value || null,
    irrigationMethod: d('irrigation').method || a('irrigation')?.value || null,
  }
}

function serialize(doc: any) {
  const { _id, ...rest } = doc
  return { id: String(_id), ...rest }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = userIdFromRequest(req)

  try {
    if (req.method === 'GET') {
      const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : null
      if (!userId && !clientId) {
        return res.status(200).json({ fields: [] })
      }
      const fields = await withDb((db) =>
        db
          .collection(COLLECTION)
          .find(userId ? { $or: [{ userId }, ...(clientId ? [{ clientId }] : [])] } : { clientId })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()
      )
      return res.status(200).json({ fields: fields.map(serialize) })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = req.body || {}
      const answers = (body.answers || {}) as Answers
      const detected = (body.detected || null) as DetectedLocation | null
      const language = String(body.language || 'en-IN')
      const clientId = typeof body.clientId === 'string' ? body.clientId : null

      const missing = FARM_QUESTIONS.filter((q) => !q.allowUnknown && !answers[q.id]?.value).map((q) => q.id)
      if (missing.includes('field_name') || missing.includes('crop')) {
        return res.status(400).json({ error: 'Field name and crop are required', missing })
      }

      const now = new Date()
      const structured = structureAnswers(answers, detected)
      const doc = {
        ...structured,
        language,
        userId,
        clientId,
        deviceLocation: detected
          ? { lat: detected.lat, lon: detected.lon, accuracyM: detected.accuracy ?? null, display: detected.display || null }
          : null,
        answers, // raw transcripts + LLM extraction for audit / re-edit
        source: 'voice_my_farm',
        updatedAt: now,
      }

      if (req.method === 'PUT') {
        const id = typeof req.query.id === 'string' ? req.query.id : ''
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Valid id is required' })
        const filter: any = { _id: new ObjectId(id) }
        if (userId) filter.$or = [{ userId }, { clientId }]
        else filter.clientId = clientId
        const result = await withDb((db) => db.collection(COLLECTION).updateOne(filter, { $set: doc }))
        if (!result.matchedCount) return res.status(404).json({ error: 'Field not found' })
        return res.status(200).json({ success: true, id, field: { id, ...doc } })
      }

      const inserted = await withDb((db) => db.collection(COLLECTION).insertOne({ ...doc, createdAt: now }))

      if (userId) {
        try {
          const { randomUUID } = await import('crypto')
          const { COLLECTIONS } = await import('../../../src/lib/mongo')
          await withDb(async (db) => {
            const existing = await db.collection(COLLECTIONS.farmProfiles).findOne({ farmer_id: userId })
            const field_id = existing?.field_id || String(inserted.insertedId)
            const cropChanged = existing?.crop && structured.crop && existing.crop !== structured.crop
            const cycles = Array.isArray(existing?.cropCycles) ? [...existing.cropCycles] : []
            if (cropChanged && cycles.length) cycles[cycles.length - 1].endedAt = now.toISOString()
            if (!cycles.length || cropChanged) {
              cycles.push({
                id: randomUUID(),
                crop: structured.crop,
                variety: structured.variety,
                sownAt: structured.sowing.date,
                endedAt: null,
                growthStage: structured.growthStage,
              })
            }
            await db.collection(COLLECTIONS.farmProfiles).updateOne(
              { farmer_id: userId },
              {
                $set: {
                  farmer_id: userId,
                  field_id,
                  setupComplete: true,
                  ...structured,
                  language,
                  timezone: existing?.timezone || 'Asia/Kolkata',
                  deviceId: existing?.deviceId || 'esp32_goa',
                  cropCycles: cycles,
                  answers,
                  draft: null,
                  updatedAt: now,
                },
                $setOnInsert: { createdAt: now },
              },
              { upsert: true }
            )
          })
        } catch (e) {
          console.warn('[my-farm/fields] farm_profiles sync skipped', e)
        }
      }

      return res.status(201).json({ success: true, id: String(inserted.insertedId), field: { id: String(inserted.insertedId), ...doc, createdAt: now } })
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : ''
      const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : null
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Valid id is required' })
      const filter: any = { _id: new ObjectId(id) }
      if (userId) filter.$or = [{ userId }, { clientId }]
      else filter.clientId = clientId
      const result = await withDb((db) => db.collection(COLLECTION).deleteOne(filter))
      return res.status(200).json({ success: result.deletedCount === 1 })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('[my-farm/fields]', error?.message || error)
    return res.status(500).json({ error: error?.message || 'Database error' })
  }
}
