import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not configured' })
    }

    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('krishi-mithr')
    const collection = db.collection('sensor_readings')
    
    // Get current sensor reading (data is updated in place, so latest = current)
    // If multiple devices, get the most recent one
    const latest = await collection
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray()
    
    await client.close()
    
    if (latest.length === 0) {
      return res.status(200).json({ 
        data: null, 
        message: 'No sensor data available',
        missing_fields: ['temperature', 'humidity', 'CO2_ppm', 'NH3_ppm', 'Benzene_ppm', 'Smoke_ppm']
      })
    }
    
    const data = latest[0]
    
    // Check which fields are missing
    const missingFields: string[] = []
    const availableFields: string[] = []
    
    const fields = ['temperature', 'humidity', 'CO2_ppm', 'NH3_ppm', 'Benzene_ppm', 'Smoke_ppm']
    fields.forEach(field => {
      if (data[field] === null || data[field] === undefined) {
        missingFields.push(field)
      } else {
        availableFields.push(field)
      }
    })
    
    return res.status(200).json({ 
      data: data,
      available_fields: availableFields,
      missing_fields: missingFields
    })
  } catch (error: any) {
    console.error('Error fetching sensor data:', error)
    return res.status(500).json({ error: 'Failed to fetch sensor data', details: error.message })
  }
}

