import type { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const deviceId = typeof req.query.device_id === 'string' ? req.query.device_id : undefined

  // Prefer Mongo (same pattern as sensor-data) so the dashboard works even if FastAPI is cold.
  if (process.env.DATABASE_URL?.startsWith('mongodb')) {
    try {
      const client = new MongoClient(process.env.DATABASE_URL)
      await client.connect()
      const db = client.db('krishi-mithr')
      const query = deviceId ? { device_id: deviceId } : {}
      const latest = await db
        .collection('camera_scans')
        .find(query)
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray()
      await client.close()

      if (!latest.length) {
        return res.status(200).json({ data: null, message: 'No camera scans yet' })
      }

      const doc = latest[0] as Record<string, unknown>
      const id = String(doc._id)
      delete doc._id
      const ts = doc.timestamp
      return res.status(200).json({
        data: {
          ...doc,
          id,
          timestamp:
            ts instanceof Date
              ? ts.toISOString()
              : typeof ts === 'string'
                ? ts
                : new Date().toISOString(),
        },
        updated: true,
      })
    } catch (error: any) {
      console.warn('[camera-scan] Mongo read failed, trying FastAPI:', error?.message)
    }
  }

  try {
    const qs = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
    const response = await fetch(`${BACKEND_URL}/api/pest/device-scan/latest${qs}`)
    const json = await response.json()
    return res.status(response.status).json(json)
  } catch (error: any) {
    return res.status(200).json({
      data: null,
      message: error?.message || 'Camera scan backend unreachable',
    })
  }
}
