# 🔍 How to Check MQTT Data in MongoDB Atlas

## ✅ Yes! You can check data directly in MongoDB Atlas

Once your MQTT service is running and receiving data, you can view it immediately in MongoDB Atlas dashboard.

## 📋 Step-by-Step: View Data in MongoDB Atlas

### Step 1: Start MQTT Service

Run the service:
```bash
python mqtt_to_mongodb_krishimithr.py
```

Or use the batch file:
```bash
run_local.bat
```

### Step 2: Wait for Data

Once ESP32 publishes data, you'll see in console:
```
📥 Received MQTT message...
✅ Saved sensor data to MongoDB (ID: ...)
```

### Step 3: Open MongoDB Atlas Dashboard

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Sign in** to your account
3. Click on your **cluster** (e.g., `Cluster0`)

### Step 4: Browse Collections

1. Click **"Browse Collections"** button (or "Collections" tab)
2. Select database: **`krishi-mithr`**
3. You'll see collections:
   - `sensor_readings` (main collection - all data)
   - `temperature_data`
   - `humidity_data`
   - `soil_moisture_data`
   - `co2_data`
   - `nh3_data`
   - `benzene_data`
   - `smoke_data`
   - `tds_data`
   - `motor_logs`

### Step 5: View Data

1. Click on **`sensor_readings`** collection
2. You'll see all saved sensor data
3. Click on any document to see full details
4. Data updates in **real-time** as new MQTT messages arrive!

## 📊 What You'll See

### In `sensor_readings` collection:

```json
{
  "_id": "...",
  "timestamp": "2025-01-XX...",
  "device_id": "esp32_sensor",
  "location": "farm_field_1",
  "temperature": 25.5,
  "humidity": 60.0,
  "soil_moisture": 45.0,
  "CO2_ppm": 400,
  "NH3_ppm": 10,
  "Benzene_ppm": 2,
  "Smoke_ppm": 5,
  "TDS": 150,
  "air_quality_status": "good",
  "water_quality": "Tap Water",
  "light": 0,
  "light_status": "Sun Rise",
  "motion": "0",
  "rain_status": "0",
  "motor_state": "false"
}
```

### In Individual Collections:

**`temperature_data`:**
```json
{
  "_id": "...",
  "value": 25.5,
  "unit": "celsius",
  "timestamp": "2025-01-XX...",
  "device_id": "esp32_sensor",
  "location": "farm_field_1"
}
```

## 🔄 Real-Time Updates

- **Data appears immediately** after MQTT message is received
- **Refresh the page** in MongoDB Atlas to see new data
- **Sort by timestamp** to see latest data first
- **Filter** by device_id, location, or date range

## 🎯 Quick Verification Checklist

- [ ] MQTT service is running
- [ ] Console shows "✅ Connected to MQTT broker"
- [ ] Console shows "📡 Subscribed to topic: krishimithr/sensor/data"
- [ ] ESP32 is publishing data
- [ ] Console shows "📥 Received MQTT message..."
- [ ] Console shows "✅ Saved sensor data to MongoDB"
- [ ] MongoDB Atlas shows `sensor_readings` collection
- [ ] Documents appear in the collection
- [ ] Latest document has recent timestamp

## 💡 Tips

1. **Sort by Timestamp**: Click on `timestamp` column to sort newest first
2. **Filter Data**: Use MongoDB Atlas filters to find specific data
3. **View Details**: Click on any document to see all fields
4. **Export Data**: Use MongoDB Atlas export feature if needed
5. **Check Individual Collections**: Each sensor type has its own collection

## 🆘 Troubleshooting

### No Data Appearing?

1. **Check MQTT Service Logs**:
   - Is it connected to MQTT broker?
   - Is it receiving messages?
   - Are there any errors?

2. **Check MongoDB Connection**:
   - Is `DATABASE_URL` set correctly?
   - Is MongoDB Atlas Network Access allowing your IP?

3. **Check ESP32**:
   - Is ESP32 publishing to correct topic?
   - Is ESP32 connected to internet?

4. **Refresh MongoDB Atlas**:
   - Click refresh button
   - Collections might take a moment to appear

## ✅ Summary

**Yes!** Once MQTT service starts and receives data:
1. ✅ Data is automatically saved to MongoDB Atlas
2. ✅ You can view it immediately in MongoDB Atlas dashboard
3. ✅ Data appears in real-time
4. ✅ All collections are created automatically
5. ✅ No additional setup needed!

**Just start the service and check MongoDB Atlas!** 🚀

