import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sendMockData = () => {
    const mock = {
      temperature: 34,
      humidity: 68,
      TDS: 950,
      soil_moisture: 18,
      CO2_ppm: 120,
      NH3_ppm: 25,
      Benzene_ppm: 5,
      Smoke_ppm: 12,
      light: 850,
      motion: 0,
      motion_detected: false,
      timestamp: new Date().toISOString()
    }

    return res.status(200).json({
      data: mock,
      updated: true,
      timestamp: mock.timestamp,
      available_fields: Object.keys(mock),
      missing_fields: [],
      mock: true,
      message: 'Serving mock sensor data (database unreachable)'
    })
  }

  try {
    if (!process.env.DATABASE_URL) {
      console.warn('[sensor-data] DATABASE_URL missing, serving mock data')
      return sendMockData()
    }

    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('krishi-mithr')
    const collection = db.collection('sensor_readings')
    
    // Get last update timestamp from query (for incremental updates)
    const lastUpdate = req.query.lastUpdate as string | undefined
    
    // Get current sensor reading (data is updated in place, so latest = current)
    // If multiple devices, get the most recent one
    let query: any = {}
    
    // If lastUpdate is provided, only get data updated after that timestamp
    if (lastUpdate) {
      try {
        const lastUpdateDate = new Date(lastUpdate)
        query.timestamp = { $gt: lastUpdateDate }
      } catch (e) {
        // Invalid date, ignore and return all data
      }
    }
    
    const latest = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray()
    
    await client.close()
    
    // If querying for updates and nothing found, return no changes
    if (lastUpdate && latest.length === 0) {
      return res.status(200).json({ 
        data: null,
        updated: false,
        message: 'No updates since last fetch',
        timestamp: new Date().toISOString()
      })
    }
    
    if (latest.length === 0) {
      return res.status(200).json({ 
        data: null, 
        updated: false,
        message: 'No sensor data available',
        missing_fields: ['temperature', 'humidity', 'CO2_ppm', 'NH3_ppm', 'Benzene_ppm', 'Smoke_ppm']
      })
    }
    
    const data = latest[0]
    
    // Check which fields are missing
    const missingFields: string[] = []
    const availableFields: string[] = []
    
    const fields = ['temperature', 'humidity', 'CO2_ppm', 'NH3_ppm', 'Benzene_ppm', 'Smoke_ppm', 
                     'soil_moisture', 'rain_status', 'motor_state', 'motor_on', 'TDS', 
                     'water_quality', 'light', 'light_status', 'motion', 'motion_detected',
                     'air_quality_status', 'CO2_ppm', 'NH3_ppm', 'Benzene_ppm', 'Smoke_ppm']
    fields.forEach(field => {
      if (data[field] === null || data[field] === undefined) {
        missingFields.push(field)
      } else {
        availableFields.push(field)
      }
    })
    
    return res.status(200).json({ 
      data: data,
      updated: true,
      timestamp: data.timestamp || new Date().toISOString(),
      available_fields: availableFields,
      missing_fields: missingFields
    })
  } catch (error: any) {
    console.error('Error fetching sensor data, serving mock:', error?.message || error)
    return sendMockData()
  }
}

