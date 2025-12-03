# Next Steps: MQTT Integration Complete! 🎉

## ✅ What's Done:
- ✅ MQTT dashboard code created
- ✅ MongoDB integration added
- ✅ API endpoints deployed to Vercel
- ✅ All code pushed to GitHub

## 🚀 What's Next:

### Step 1: Run the Python Dashboard

The dashboard needs to run to receive MQTT data and save it to MongoDB.

#### Install Dependencies:
```bash
pip install -r requirements_mqtt.txt
```

Or install individually:
```bash
pip install paho-mqtt pymongo python-dotenv
```

#### Set Environment Variable:
Create a `.env` file in the project root:
```env
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

Or set it directly in the script (line 12 of `mqtt_mongodb_dashboard.py`).

#### Run the Dashboard:
```bash
python mqtt_mongodb_dashboard.py
```

**What happens:**
- Dashboard window opens
- Connects to MQTT broker
- Waits for ESP32 to publish sensor data
- Automatically saves to MongoDB when data arrives

---

### Step 2: Test API Endpoints

Once the dashboard is running and receiving data, test the endpoints:

#### Test Latest Sensor Data:
```javascript
fetch('https://krishi-mithr.vercel.app/api/sensor-data/latest')
  .then(r => r.json())
  .then(data => {
    console.log('Latest Data:', data)
  })
  .catch(console.error)
```

#### Test Historical Data:
```javascript
fetch('https://krishi-mithr.vercel.app/api/sensor-data/history?hours=24')
  .then(r => r.json())
  .then(data => {
    console.log('History:', data)
  })
  .catch(console.error)
```

#### Test Motor Logs:
```javascript
fetch('https://krishi-mithr.vercel.app/api/sensor-data/motor-logs?hours=24')
  .then(r => r.json())
  .then(data => {
    console.log('Motor Logs:', data)
  })
  .catch(console.error)
```

---

### Step 3: Integrate into Website UI

Create React components to display sensor data on your website.

#### Example: Sensor Data Component

Create `src/components/ui/sensor-dashboard.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'

interface SensorData {
  temperature: number
  humidity: number
  CO2_ppm: number
  NH3_ppm: number
  Benzene_ppm: number
  Smoke_ppm: number
  air_quality_status: string
  timestamp: string
}

export function SensorDashboard() {
  const [data, setData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sensor-data/latest')
        const result = await response.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching sensor data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Loading sensor data...</div>
  if (!data) return <div>No sensor data available</div>

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Sensor Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Temperature</p>
          <p className="text-2xl font-bold">{data.temperature} °C</p>
        </div>
        
        <div>
          <p className="text-gray-600">Humidity</p>
          <p className="text-2xl font-bold">{data.humidity} %</p>
        </div>
        
        <div>
          <p className="text-gray-600">CO₂</p>
          <p className="text-2xl font-bold">{data.CO2_ppm} ppm</p>
        </div>
        
        <div>
          <p className="text-gray-600">NH₃</p>
          <p className="text-2xl font-bold">{data.NH3_ppm} ppm</p>
        </div>
        
        <div>
          <p className="text-gray-600">Benzene</p>
          <p className="text-2xl font-bold">{data.Benzene_ppm} ppm</p>
        </div>
        
        <div>
          <p className="text-gray-600">Smoke</p>
          <p className="text-2xl font-bold">{data.Smoke_ppm} ppm</p>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-gray-600">Air Quality</p>
        <p className={`text-xl font-bold ${
          data.air_quality_status === 'good' ? 'text-green-600' : 'text-red-600'
        }`}>
          {data.air_quality_status === 'good' ? '✅ Good' : '⚠️ Poor'}
        </p>
      </div>
      
      <p className="text-sm text-gray-500 mt-4">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </p>
    </div>
  )
}
```

#### Add to Your Page:

```typescript
import { SensorDashboard } from '@/components/ui/sensor-dashboard'

export default function DashboardPage() {
  return (
    <div>
      <SensorDashboard />
    </div>
  )
}
```

---

### Step 4: Verify Everything Works

#### Checklist:

- [ ] Python dashboard is running
- [ ] ESP32 is publishing to MQTT topic `ravindra/sensor/data`
- [ ] Dashboard shows sensor values updating
- [ ] MongoDB collections created (`sensor_data`, `motor_logs`)
- [ ] API endpoints return data (not null)
- [ ] Website displays sensor data

---

### Step 5: Optional Enhancements

#### Add Charts for Historical Data:

```typescript
import { Line } from 'react-chartjs-2'

// Fetch history and display as chart
const [history, setHistory] = useState([])

useEffect(() => {
  fetch('/api/sensor-data/history?hours=24')
    .then(r => r.json())
    .then(result => setHistory(result.data))
}, [])
```

#### Add Real-time Updates:

Use WebSockets or polling every few seconds to update the UI automatically.

#### Add Alerts:

```typescript
useEffect(() => {
  if (data && data.air_quality_status === 'poor') {
    alert('⚠️ Poor air quality detected!')
  }
}, [data])
```

---

## 🎯 Quick Start Summary:

1. **Run Python Dashboard:**
   ```bash
   pip install -r requirements_mqtt.txt
   python mqtt_mongodb_dashboard.py
   ```

2. **Test API:**
   ```javascript
   fetch('/api/sensor-data/latest').then(r => r.json()).then(console.log)
   ```

3. **Add to Website:**
   - Create sensor dashboard component
   - Display data in your UI
   - Add real-time updates

---

## 📊 Data Flow:

```
ESP32 → MQTT → Python Dashboard → MongoDB → API Endpoints → Website
```

Everything is connected! Just run the dashboard and data will start flowing! 🚀








