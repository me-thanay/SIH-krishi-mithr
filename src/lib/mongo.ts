import { MongoClient, type Db } from 'mongodb'

const DB_NAME = process.env.MONGODB_DB || 'krishi-mithr'

let cached: { client: MongoClient; db: Db } | null = null

export function mongoUri(): string | null {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI || ''
  return uri.startsWith('mongodb') ? uri : null
}

export async function getDb(): Promise<Db> {
  const uri = mongoUri()
  if (!uri) throw new Error('DATABASE_URL (MongoDB) is not configured')
  if (cached) return cached.db
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 })
  try {
    await client.connect()
  } catch (error: any) {
    const msg = String(error?.message || error)
    if (/ENOTFOUND|querySrv/i.test(msg)) {
      throw new Error('Farm database host could not be reached. Answers are saved on this device instead.')
    }
    throw error
  }
  cached = { client, db: client.db(DB_NAME) }
  return cached.db
}

export const COLLECTIONS = {
  farmProfiles: 'farm_profiles',
  farmFields: 'farm_fields',
  sensorHourly: 'sensor_hourly',
  sensorEvents: 'sensor_events',
  dailyBriefs: 'daily_briefs',
  sensorReadings: 'sensor_readings',
} as const
