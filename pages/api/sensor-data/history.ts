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

    const { hours = 24, limit = 100 } = req.query
    
    const client = new MongoClient(process.env.DATABASE_URL)
    await client.connect()
    const db = client.db('krishi-mithr')
    // Use the same collection as the live dashboard (`sensor_readings`)
    const collection = db.collection('sensor_readings')
    
    // Calculate cutoff time
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - Number(hours))
    
    // Fetch historical data
    const history = await collection
      .find({ timestamp: { $gte: cutoffTime } })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .toArray()
    
    await client.close()
    
    return res.status(200).json({ 
      data: history,
      count: history.length,
      hours: Number(hours)
    })
  } catch (error: any) {
    console.error('Error fetching sensor history:', error)
    return res.status(500).json({ error: 'Failed to fetch sensor history', details: error.message })
  }
}









