import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

// Define all possible sensor data types
const SENSOR_TYPES = [
  'temperature',
  'humidity',
  'co2',
  'nh3',
  'benzene',
  'smoke'
] as const

type SensorType = typeof SENSOR_TYPES[number]

// Collection name mapping
const COLLECTION_MAP: Record<SensorType, string> = {
  temperature: 'temperature_data',
  humidity: 'humidity_data',
  co2: 'co2_data',
  nh3: 'nh3_data',
  benzene: 'benzene_data',
  smoke: 'smoke_data'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not configured' })
    }

    const { hours = 1 } = req.query
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - Number(hours))

    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('krishi-mithr')

    // Fetch latest value for each sensor type
    const sensorData: Record<string, any> = {}
    const missingTypes: string[] = []

    for (const sensorType of SENSOR_TYPES) {
      try {
        const collection = db.collection(COLLECTION_MAP[sensorType])
        const latest = await collection
          .find({ timestamp: { $gte: cutoffTime } })
          .sort({ timestamp: -1 })
          .limit(1)
          .toArray()

        if (latest.length > 0) {
          sensorData[sensorType] = {
            value: latest[0].value,
            unit: latest[0].unit,
            timestamp: latest[0].timestamp,
            available: true
          }
        } else {
          missingTypes.push(sensorType)
          sensorData[sensorType] = {
            value: null,
            unit: null,
            timestamp: null,
            available: false
          }
        }
      } catch (error) {
        missingTypes.push(sensorType)
        sensorData[sensorType] = {
          value: null,
          unit: null,
          timestamp: null,
          available: false,
          error: 'Collection not found or error fetching data'
        }
      }
    }

    await client.close()

    return res.status(200).json({
      data: sensorData,
      missing_types: missingTypes,
      available_types: SENSOR_TYPES.filter(t => !missingTypes.includes(t)),
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching sensor data:', error)
    return res.status(500).json({ 
      error: 'Failed to fetch sensor data', 
      details: error.message 
    })
  }
}

















