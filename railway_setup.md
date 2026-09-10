# 🚂 Railway Setup Guide (100% Free)

## Why Railway?

- ✅ **Free tier available** for background workers
- ✅ **$5 free credit monthly** (enough for MQTT service)
- ✅ **No payment info required** initially
- ✅ **Easy setup** via GitHub

## Step-by-Step Setup

### Step 1: Sign Up

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)

### Step 2: Create Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `SIH-krishi-mithr`
4. Railway will detect the project

### Step 3: Configure Service

1. Railway will create a service automatically
2. Click on the service to open it
3. Railway should auto-detect `railway.json` configuration

### Step 4: Verify Build & Start Commands

Railway should auto-detect from `railway.json`, but verify:

1. Go to **"Settings"** tab
2. Check **"Build Command"** (should be):
   ```bash
   pip install -r requirements_mqtt.txt
   ```
3. Check **"Start Command"** (should be):
   ```bash
   python mqtt_to_mongodb_krishimithr.py
   ```
   
   If not set, add them manually.

### Step 5: Add Environment Variable

1. Go to **"Variables"** tab
2. Click **"New Variable"**
3. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: `mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0`

### Step 6: Deploy

1. Railway will automatically deploy
2. Check **"Deployments"** tab for status
3. Check **"Logs"** tab to see output

### Step 7: Verify

In the **"Logs"** tab, you should see:
```
✅ Connected to MongoDB Atlas
✅ Connected to MQTT broker
📡 Subscribed to topic: krishimithr/sensor/data
⏳ Waiting for sensor data...
```

## ✅ That's It!

Your MQTT service is now running on Railway for **FREE**!

## 💰 Free Tier Limits

- **$5 free credit per month**
- Enough for background workers
- Auto-pauses if you exceed (no charges)

## 🎯 Next Steps

1. Service is running ✅
2. ESP32 publishes data → MQTT → Railway → MongoDB ✅
3. Your Vercel frontend reads from MongoDB ✅

## 🆘 Troubleshooting

**Service not starting?**
- Check logs in Railway dashboard
- Verify `DATABASE_URL` is set correctly
- Check build command installed dependencies

**Need help?**
- Railway has great documentation
- Check Railway Discord community

---

**Total setup time: 5 minutes!** ⚡

