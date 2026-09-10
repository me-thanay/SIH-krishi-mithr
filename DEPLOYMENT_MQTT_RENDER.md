# 🚀 Deploying MQTT to MongoDB Service on Render

## ⚠️ Important: Vercel vs Render

### ❌ **Vercel is NOT suitable for MQTT service**
- Vercel functions have execution time limits (10-60 seconds)
- They're designed for HTTP requests, not persistent connections
- You **cannot** maintain a persistent MQTT connection on Vercel
- **Solution**: Deploy the MQTT service on **Render** as a Background Worker

### ✅ **Render is perfect for MQTT service**
- Supports long-running background workers
- Maintains persistent connections
- Free tier available for background workers

---

## 📋 Deployment Options

### Option 1: Using Render Dashboard (Recommended for first-time setup)

#### Step 1: Create Background Worker Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Background Worker"**
3. Connect your GitHub repository
4. Configure the service:

   **Name:** `krishi-mithr-mqtt-worker`
   
   **Environment:** `Python 3`
   
   **Build Command:**
   ```bash
   pip install -r requirements_mqtt.txt
   ```
   
   **Start Command:**
   ```bash
   python mqtt_to_mongodb_krishimithr.py
   ```

#### Step 2: Add Environment Variables

In the Render dashboard, add:

```env
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

**Important:** Make sure this matches your MongoDB Atlas connection string.

#### Step 3: Deploy

Click **"Create Background Worker"** and Render will:
- Install dependencies
- Start the MQTT service
- Keep it running 24/7

---

### Option 2: Using `render.yaml` (Infrastructure as Code)

If you have `render.yaml` in your repository:

1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Review the services and click **"Apply"**

The `render.yaml` file will create:
- ✅ FastAPI backend (if not already deployed)
- ✅ MQTT background worker

---

## 🔧 Configuration Details

### Build Command
```bash
pip install -r requirements_mqtt.txt
```

This installs:
- `paho-mqtt` - MQTT client library
- `pymongo` - MongoDB driver
- `python-dotenv` - Environment variable management

### Start Command
```bash
python mqtt_to_mongodb_krishimithr.py
```

This runs the MQTT service that:
- Connects to MQTT broker (`broker.hivemq.com`)
- Subscribes to `krishimithr/sensor/data`
- Saves all sensor data to MongoDB Atlas

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/krishi-mithr` |

---

## ✅ Verification Steps

### 1. Check Service Status

1. Go to Render Dashboard
2. Click on your `krishi-mithr-mqtt-worker` service
3. Check **"Logs"** tab
4. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Connected to MQTT broker
   📡 Subscribed to topic: krishimithr/sensor/data
   ⏳ Waiting for sensor data...
   ```

### 2. Test MQTT Connection

When your ESP32 publishes data, you should see in logs:
```
📥 Received MQTT message from krishimithr/sensor/data:
   Raw data: {...}
✅ Saved sensor data to MongoDB (ID: ...)
```

### 3. Verify MongoDB Data

1. Go to MongoDB Atlas Dashboard
2. Browse Collections in `krishi-mithr` database
3. You should see collections:
   - `sensor_readings` (complete records)
   - `temperature_data`
   - `humidity_data`
   - `soil_moisture_data`
   - `co2_data`
   - `nh3_data`
   - `benzene_data`
   - `smoke_data`
   - `tds_data`
   - `motor_logs`

---

## 🐛 Troubleshooting

### Service Keeps Restarting

**Check logs for:**
- MongoDB connection errors
- MQTT broker connection errors
- Missing environment variables

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check MongoDB Atlas Network Access (should allow `0.0.0.0/0`)
- Verify MQTT broker is accessible

### No Data Being Saved

**Check:**
1. ESP32 is publishing to correct topic: `krishimithr/sensor/data`
2. MQTT broker is `broker.hivemq.com:1883`
3. Service logs show "Subscribed to topic" message
4. ESP32 is actually sending data

### Connection Timeout

**If you see connection errors:**
- MongoDB Atlas: Check Network Access settings
- MQTT: `broker.hivemq.com` is a public broker, should be accessible

---

## 💰 Free Tier Configuration

### ✅ Optimized for Free Tier
The service has been optimized to work on Render's free tier:

1. **Keep-Alive Mechanism**: 
   - Periodic heartbeat every 5 minutes
   - Prevents service from being marked as idle
   - Maintains MQTT connection actively

2. **MQTT Keepalive**: 
   - Set to 60 seconds
   - Maintains persistent connection to broker

3. **Free Tier Limitations**:
   - ⚠️ **750 free instance hours per month** (shared across all services)
   - ⚠️ Services may spin down after 15 minutes of **complete** inactivity
   - ✅ **With keep-alive, service stays active** as long as it's processing data
   - ✅ MQTT connection keeps service active

### 💡 Free Tier Tips

**To maximize free tier usage:**
- Keep-alive mechanism prevents idle spin-down
- MQTT messages keep the service active
- Monitor your usage in Render dashboard
- If you exceed 750 hours, service pauses until next month

### 🚀 When to Upgrade

Consider paid plans ($7/month) if:
- You need guaranteed 24/7 uptime
- You exceed 750 hours/month
- You need better performance
- You need persistent disks

**For most use cases, free tier works perfectly!** ✅

---

## 🔄 Updating the Service

### After Code Changes

1. Push changes to GitHub
2. Render will auto-deploy (if auto-deploy is enabled)
3. Or manually trigger deployment from Render dashboard

### After Environment Variable Changes

1. Update environment variables in Render dashboard
2. Service will automatically restart with new values

---

## 📊 Monitoring

### View Logs
- Render Dashboard → Your Service → **"Logs"** tab
- Real-time logs of MQTT messages and MongoDB saves

### Metrics
- Render Dashboard shows:
  - CPU usage
  - Memory usage
  - Uptime status

---

## 🎯 Summary

### What Gets Deployed:

1. **Vercel** (Frontend):
   - ✅ Next.js website
   - ✅ API endpoints to read MongoDB data
   - ❌ **NOT** running MQTT service

2. **Render** (Backend):
   - ✅ FastAPI backend (if you have one)
   - ✅ **MQTT to MongoDB worker** (this service)

3. **MongoDB Atlas**:
   - ✅ Stores all sensor data
   - ✅ Accessible from both Vercel and Render

### Data Flow:

```
ESP32 → MQTT Broker → Render Worker → MongoDB Atlas → Vercel API → Frontend
```

---

## ✅ Quick Checklist

- [ ] Created Background Worker on Render
- [ ] Set `DATABASE_URL` environment variable
- [ ] Service is running (check logs)
- [ ] ESP32 is publishing to `krishimithr/sensor/data`
- [ ] Data is appearing in MongoDB Atlas
- [ ] Vercel API endpoints can read the data

---

## 🚀 Next Steps

1. Deploy the worker on Render
2. Verify it's receiving MQTT data
3. Check MongoDB for saved data
4. Test Vercel API endpoints
5. Your frontend will automatically show the data!

