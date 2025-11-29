# MQTT to MongoDB Integration Setup

## Overview
This integration saves sensor data from MQTT to MongoDB Atlas, making it available for your website.

## Installation

### 1. Install Required Packages
```bash
pip install -r requirements_mqtt.txt
```

Or individually:
```bash
pip install paho-mqtt pymongo python-dotenv
```

### 2. Environment Variables
Create a `.env` file in the same directory as the script:
```env
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

Or set it directly in the script (less secure).

## How It Works

### Data Flow:
1. **ESP32** → Publishes sensor data to MQTT topic `ravindra/sensor/data`
2. **Python Dashboard** → Receives MQTT data
3. **MongoDB Atlas** → Stores sensor readings in `sensor_data` collection
4. **Website** → Can query MongoDB to display data

### Collections Created:

#### 1. `sensor_data` Collection
Stores sensor readings with structure:
```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "CO2_ppm": 400,
  "NH3_ppm": 10,
  "Benzene_ppm": 2,
  "Smoke_ppm": 5,
  "air_quality_status": "good",
  "timestamp": "2025-11-28T12:00:00Z",
  "device_id": "esp32_sensor",
  "location": "farm_field_1"
}
```

#### 2. `motor_logs` Collection
Stores motor control actions:
```json
{
  "action": "on",
  "status": "ON",
  "timestamp": "2025-11-28T12:00:00Z",
  "device_id": "esp32_motor",
  "location": "farm_field_1"
}
```

## Running the Dashboard

```bash
python mqtt_mongodb_dashboard.py
```

## Features

- ✅ Real-time sensor data display
- ✅ Automatic MongoDB storage
- ✅ Motor control with logging
- ✅ Air quality status calculation
- ✅ Connection status monitoring

## Next Steps: Website Integration

### Create API Endpoint in Next.js

Create `pages/api/sensor-data/latest.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import { MongoClient } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const client = new MongoClient(process.env.DATABASE_URL!)
    await client.connect()
    const db = client.db('krishi-mithr')
    const collection = db.collection('sensor_data')
    
    // Get latest sensor reading
    const latest = await collection
      .find()
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray()
    
    await client.close()
    
    return res.status(200).json({ data: latest[0] || null })
  } catch (error: any) {
    console.error('Error fetching sensor data:', error)
    return res.status(500).json({ error: 'Failed to fetch sensor data' })
  }
}
```

### Create API Endpoint for Historical Data

Create `pages/api/sensor-data/history.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { MongoClient } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { hours = 24 } = req.query
    
    const client = new MongoClient(process.env.DATABASE_URL!)
    await client.connect()
    const db = client.db('krishi-mithr')
    const collection = db.collection('sensor_data')
    
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - Number(hours))
    
    const history = await collection
      .find({ timestamp: { $gte: cutoffTime } })
      .sort({ timestamp: -1 })
      .toArray()
    
    await client.close()
    
    return res.status(200).json({ data: history })
  } catch (error: any) {
    console.error('Error fetching sensor history:', error)
    return res.status(500).json({ error: 'Failed to fetch sensor history' })
  }
}
```

## Usage in React Components

```typescript
// Fetch latest sensor data
const fetchSensorData = async () => {
  const response = await fetch('/api/sensor-data/latest')
  const { data } = await response.json()
  return data
}

// Fetch historical data (last 24 hours)
const fetchHistory = async () => {
  const response = await fetch('/api/sensor-data/history?hours=24')
  const { data } = await response.json()
  return data
}
```

## Troubleshooting

### MongoDB Connection Failed
- Check `DATABASE_URL` in `.env` file
- Verify MongoDB Atlas Network Access allows your IP
- Check MongoDB user permissions

### No Data Saved
- Check console for error messages
- Verify MQTT messages are being received
- Check MongoDB connection status in dashboard

### Data Not Appearing on Website
- Verify API endpoints are created
- Check browser console for errors
- Verify `DATABASE_URL` is set in Vercel environment variables

