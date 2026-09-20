import jwt from 'jsonwebtoken'
import type { NextApiRequest } from 'next'
import type { Answers, DetectedLocation } from './my-farm-schema'

export function userIdFromRequest(req: NextApiRequest): string | null {
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

export interface CropCycle {
  id: string
  crop: string
  variety: string | null
  sownAt: string | null
  endedAt: string | null
  growthStage: string | null
}

export interface FarmProfile {
  farmer_id: string
  field_id: string
  setupComplete: boolean
  fieldName: string | null
  crop: string | null
  cropLocal: string | null
  variety: string | null
  location: {
    village: string | null
    district: string | null
    state: string | null
    lat: number | null
    lon: number | null
    accuracyM: number | null
    confirmedGps: boolean
  }
  area: { value: number | null; unit: string | null; spoken: string | null }
  sowing: { date: string | null; approximate: boolean; method: string | null; spoken: string | null }
  growthStage: string | null
  soilType: string | null
  irrigationMethod: string | null
  language: string
  timezone: string
  deviceId: string
  cropCycles: CropCycle[]
  draft: { answers: Answers; language: string; detected: DetectedLocation | null } | null
  answers?: Answers
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}

export function structureAnswers(answers: Answers, detected?: DetectedLocation | null) {
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

/** Calibrated-enough moisture bands by crop family + stage (percent, uncalibrated probe). */
export function moistureBand(crop: string | null, stage: string | null): { min: number; max: number; note: string } {
  const c = (crop || '').toLowerCase()
  const s = (stage || 'vegetative').toLowerCase()
  const family = /rice|paddy/.test(c)
    ? 'rice'
    : /potato|tomato|chilli|chili|brinjal|onion/.test(c)
      ? 'veg'
      : /cotton|groundnut|maize|corn|wheat/.test(c)
        ? 'field'
        : 'default'
  const table: Record<string, Record<string, [number, number]>> = {
    rice: { seedling: [60, 85], vegetative: [55, 80], flowering: [50, 75], fruiting: [45, 70], maturity: [35, 55] },
    veg: { seedling: [50, 75], vegetative: [45, 70], flowering: [40, 65], fruiting: [35, 60], maturity: [30, 50] },
    field: { seedling: [40, 65], vegetative: [35, 60], flowering: [35, 55], fruiting: [30, 50], maturity: [25, 45] },
    default: { seedling: [40, 70], vegetative: [35, 65], flowering: [35, 60], fruiting: [30, 55], maturity: [25, 45] },
  }
  const row = table[family]
  const pair = row[s] || row.vegetative
  return {
    min: pair[0],
    max: pair[1],
    note: `${crop || 'crop'} · ${stage || 'unknown stage'} typical soil moisture ${pair[0]}–${pair[1]}% (uncalibrated probe)`,
  }
}

export function localDateInTz(date: Date, tz = 'Asia/Kolkata'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export function hourStartUtc(date: Date): Date {
  const d = new Date(date)
  d.setUTCMinutes(0, 0, 0)
  return d
}
