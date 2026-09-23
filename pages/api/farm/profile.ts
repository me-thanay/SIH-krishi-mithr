import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'
import { FARM_QUESTIONS, type Answers, type DetectedLocation } from '../../../src/lib/my-farm-schema'
import { COLLECTIONS, getDb } from '../../../src/lib/mongo'
import { getLocalFarmProfile, saveLocalFarmProfile } from '../../../src/lib/farm-local-store'
import { structureAnswers, userIdFromRequest, type CropCycle } from '../../../src/lib/farm-profile'

function serialize(doc: any) {
  if (!doc) return null
  const { _id, ...rest } = doc
  return { id: String(_id || rest.field_id || 'local'), ...rest }
}

function buildDoc(
  userId: string,
  answers: Answers,
  detected: DetectedLocation | null,
  language: string,
  existing: any
) {
  const structured = structureAnswers(answers, detected)
  const field_id = existing?.field_id || randomUUID()
  const now = new Date()
  const cycles: CropCycle[] = Array.isArray(existing?.cropCycles) ? [...existing.cropCycles] : []
  const last = cycles[cycles.length - 1]
  const cropChanged = structured.crop && last && last.crop !== structured.crop
  if (cropChanged && last) last.endedAt = now.toISOString()
  if (!last || cropChanged) {
    cycles.push({
      id: randomUUID(),
      crop: structured.crop || 'unknown',
      variety: structured.variety,
      sownAt: structured.sowing.date,
      endedAt: null,
      growthStage: structured.growthStage,
    })
  } else if (last) {
    last.growthStage = structured.growthStage
    last.variety = structured.variety
    if (structured.sowing.date) last.sownAt = structured.sowing.date
  }
  return {
    farmer_id: userId,
    field_id,
    setupComplete: true,
    ...structured,
    language,
    timezone: existing?.timezone || 'Asia/Kolkata',
    deviceId: existing?.deviceId || 'esp32_goa',
    deviceLocation: detected
      ? { lat: detected.lat, lon: detected.lon, accuracyM: detected.accuracy ?? null, display: detected.display || null }
      : existing?.deviceLocation || null,
    cropCycles: cycles,
    answers,
    draft: null,
    updatedAt: now,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = userIdFromRequest(req)
  if (!userId) return res.status(401).json({ error: 'Sign in to save farm details with your profile' })

  let db: Awaited<ReturnType<typeof getDb>> | null = null
  try {
    db = await getDb()
  } catch (error: any) {
    console.warn('[farm/profile] mongo unavailable, using local store', error?.message)
  }

  try {
    const col = db?.collection(COLLECTIONS.farmProfiles)

    if (req.method === 'GET') {
      const profile = col
        ? await col.findOne({ farmer_id: userId })
        : getLocalFarmProfile(userId)
      const local = profile || getLocalFarmProfile(userId)
      return res.status(200).json({
        setupComplete: Boolean(local?.setupComplete),
        profile: serialize(local),
        draft: local?.draft || null,
      })
    }

    if (req.method === 'PATCH') {
      const body = req.body || {}
      const draft = {
        answers: (body.answers || {}) as Answers,
        language: String(body.language || 'en-IN'),
        detected: (body.detected || null) as DetectedLocation | null,
        savedAt: new Date(),
      }
      if (col) {
        await col.updateOne(
          { farmer_id: userId },
          {
            $set: { draft, updatedAt: new Date() },
            $setOnInsert: {
              farmer_id: userId,
              field_id: randomUUID(),
              setupComplete: false,
              deviceId: 'esp32_goa',
              timezone: 'Asia/Kolkata',
              cropCycles: [],
              createdAt: new Date(),
            },
          },
          { upsert: true }
        )
      } else {
        const existing = getLocalFarmProfile(userId) || { farmer_id: userId, field_id: randomUUID(), setupComplete: false }
        saveLocalFarmProfile(userId, { ...existing, draft, updatedAt: new Date() })
      }
      return res.status(200).json({ ok: true, draftSaved: true })
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {}
      const answers = (body.answers || {}) as Answers
      const detected = (body.detected || null) as DetectedLocation | null
      const language = String(body.language || 'en-IN')
      const missing = FARM_QUESTIONS.filter((q) => !q.allowUnknown && !answers[q.id]?.value).map((q) => q.id)
      if (missing.includes('field_name') || missing.includes('crop')) {
        return res.status(400).json({ error: 'Field name and crop are required', missing })
      }

      const existing = col ? await col.findOne({ farmer_id: userId }) : getLocalFarmProfile(userId)
      const now = new Date()
      const doc = buildDoc(userId, answers, detected, language, existing)
      saveLocalFarmProfile(userId, { ...doc, createdAt: existing?.createdAt || now })
      if (col) {
        await col.updateOne({ farmer_id: userId }, { $set: doc, $setOnInsert: { createdAt: now } }, { upsert: true })
      }
      return res.status(200).json({
        success: true,
        setupComplete: true,
        profile: { id: String(existing?._id || doc.field_id), ...doc },
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('[farm/profile]', error?.message || error)
    const msg = String(error?.message || '')
    if (/ENOTFOUND|querySrv|ECONNREFUSED|MongoServerSelection/i.test(msg)) {
      return res.status(503).json({
        error: 'Could not reach the farm database. Your answers are kept on this device — tap Save again in a moment.',
      })
    }
    return res.status(500).json({ error: error?.message || 'Database error' })
  }
}
