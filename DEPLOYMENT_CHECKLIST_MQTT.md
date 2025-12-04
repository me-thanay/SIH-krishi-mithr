# Deployment Checklist for MQTT Integration

## ✅ Vercel - Automatic (No Action Needed)

### What Happens Automatically:
1. **Git Push** → Vercel auto-deploys
2. **Build Process** → Installs `mongodb` package (already in `package.json`)
3. **API Endpoints** → Available at:
   - `https://krishi-mithr.vercel.app/api/sensor-data/latest`
   - `https://krishi-mithr.vercel.app/api/sensor-data/history`
   - `https://krishi-mithr.vercel.app/api/sensor-data/motor-logs`

### Environment Variables:
- ✅ **No new variables needed**
- Uses existing `DATABASE_URL` (already set)

### What to Verify:
1. Go to **Vercel Dashboard** → **Deployments**
2. Check latest deployment is **successful** (green checkmark)
3. If build fails, check logs for errors

---

## ✅ Render - No Changes Needed

### Why No Changes:
- The MQTT integration is a **Python script** (`mqtt_mongodb_dashboard.py`)
- It runs **separately** (not on Render)
- Render backend (FastAPI) doesn't need updates for this

### Render Backend:
- ✅ Already configured correctly
- ✅ No changes needed

---

## ⚠️ MongoDB Atlas - Verify Collections

### Collections Created Automatically:
When the Python dashboard runs and receives MQTT data, it will create:
- `sensor_data` collection
- `motor_logs` collection

### To Verify:
1. Go to **MongoDB Atlas Dashboard**
2. Click on your cluster
3. Click **"Browse Collections"**
4. You should see `sensor_data` and `motor_logs` after the dashboard runs

---

## 📋 Quick Checklist

### Vercel:
- [x] Code pushed to GitHub (✅ Done)
- [ ] Verify deployment succeeded (check Vercel dashboard)
- [ ] Test API endpoints after deployment

### Render:
- [x] No changes needed (✅ Done)

### MongoDB Atlas:
- [x] Network Access configured (✅ Already done)
- [ ] Collections will be created when dashboard runs

### Python Dashboard:
- [ ] Install dependencies: `pip install -r requirements_mqtt.txt`
- [ ] Set `DATABASE_URL` in `.env` file
- [ ] Run: `python mqtt_mongodb_dashboard.py`

---

## 🧪 Test After Deployment

### Test API Endpoints (after Vercel deploys):

```javascript
// Test latest sensor data
fetch('https://krishi-mithr.vercel.app/api/sensor-data/latest')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)

// Test historical data
fetch('https://krishi-mithr.vercel.app/api/sensor-data/history?hours=24')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Expected Responses:

#### If no data yet:
```json
{
  "data": null,
  "message": "No sensor data available"
}
```

#### If data exists:
```json
{
  "data": {
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
}
```

---

## 🚀 Summary

### What You Need to Do:

1. **Vercel**: 
   - ✅ Nothing! Auto-deploys from git push
   - Just verify deployment succeeded

2. **Render**: 
   - ✅ Nothing! No changes needed

3. **Python Dashboard** (Local):
   - Install dependencies
   - Run the script
   - It will start saving data to MongoDB

4. **Test**:
   - Wait for Vercel deployment (2-3 minutes)
   - Test API endpoints
   - Run Python dashboard to start collecting data

---

## ⚡ Quick Start Commands

```bash
# 1. Install Python dependencies
pip install -r requirements_mqtt.txt

# 2. Create .env file (or set DATABASE_URL in script)
echo 'DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0' > .env

# 3. Run dashboard
python mqtt_mongodb_dashboard.py
```

That's it! The dashboard will automatically save data to MongoDB, and your website can fetch it via the API endpoints.










