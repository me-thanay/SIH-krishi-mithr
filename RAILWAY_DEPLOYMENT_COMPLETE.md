# 🚂 Complete Railway Deployment Guide

This guide will help you deploy your **Krishi Mithr** backend services on Railway.

## 📋 What You'll Deploy

1. **FastAPI Backend** - Main API server
2. **MQTT Worker** (Optional) - Background service for sensor data

**Note:** Your frontend is deployed on Netlify/Vercel, so this guide focuses only on backend services.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"** in Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `SIH-krishi-mithr` (or your repo name)
4. Railway will create a project

### Step 3: Deploy Backend Service

1. Railway will auto-detect your code and create a service
2. If not, click **"+ New"** → **"GitHub Repo"** → Select your repo
3. Railway will use `Dockerfile.railway` automatically (configured in `railway.json`)

### Step 4: Add Environment Variables

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

5. Railway will automatically deploy after you save

### Step 5: Get Your Backend URL

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** (if not already generated)
3. Copy your Railway URL (e.g., `https://your-backend.up.railway.app`)

### Step 6: Update Frontend (Netlify/Vercel)

1. Go to your frontend deployment (Netlify or Vercel)
2. Go to **Environment Variables**
3. Update `NEXT_PUBLIC_API_URL` to your Railway backend URL
4. Redeploy your frontend

**Done!** Your backend is now deployed on Railway.

---

## 📖 Detailed Step-by-Step Guide

### Part 1: FastAPI Backend Deployment

#### Step 1: Create Backend Service

1. In Railway dashboard, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose your repository: `SIH-krishi-mithr`
4. Railway will create a new service

#### Step 2: Configure Service (Automatic)

Railway will automatically:
- ✅ Detect `railway.json` configuration
- ✅ Use `Dockerfile.railway` for building
- ✅ Set up the service

**No manual configuration needed!** The `railway.json` file already has:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.railway"
  }
}
```

#### Step 3: Add Environment Variables

1. Click on your backend service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables one by one:

**Required:**
```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

**Optional (for full functionality):**
```bash
OPENWEATHER_API_KEY=your_openweather_api_key_here
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
NASA_POWER_API_KEY=your_nasa_power_api_key_here
OPENLANDMAP_API_KEY=your_openlandmap_api_key_here
ONESOIL_API_KEY=your_onesoil_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=kissan_verification_token
WEBHOOK_URL=https://your-backend-url.up.railway.app/api/webhook/whatsapp
```

**Note:** After adding each variable, Railway will automatically redeploy.

#### Step 4: Verify Deployment

1. Go to **"Deployments"** tab
2. Wait for deployment to complete (green checkmark)
3. Go to **"Logs"** tab
4. You should see:
   ```
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:PORT
   ```

#### Step 5: Test Backend

1. Go to **"Settings"** → **"Networking"**
2. Copy your service URL (e.g., `https://your-backend.up.railway.app`)
3. Test in browser:
   - Health: `https://your-backend.up.railway.app/health`
   - Root: `https://your-backend.up.railway.app/`
   - Should see: `{"status": "healthy", "message": "All services operational"}`

---

### Part 2: MQTT Worker Deployment (Optional)

If you need the MQTT worker to process sensor data:

#### Step 1: Create Worker Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose the same repository
4. Railway will create a new service

#### Step 2: Configure Service

1. Click on the new service
2. Go to **"Settings"** tab
3. Railway should auto-detect `railway.mqtt.json`
4. If not, set:
   - **Dockerfile Path:** `Dockerfile.railway.mqtt`

#### Step 3: Add Environment Variables

Go to **"Variables"** tab and add:

**Required:**
```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

**MQTT Configuration (if your script uses env vars):**
```bash
MQTT_BROKER_URL=broker.hivemq.com
MQTT_USERNAME=krishi1
MQTT_PASSWORD=krishi1
MQTT_PORT=1883
MQTT_PUBLISH_TOPIC=krishimithr/sensor/data
MQTT_SUB_TOPIC=krishimithr/device/cmd
```

**Note:** If your MQTT script has hardcoded values, you may not need these env vars.

#### Step 4: Verify Worker

1. Go to **"Logs"** tab
2. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Connected to MQTT broker
   📡 Subscribed to topic: krishimithr/sensor/data
   ⏳ Waiting for sensor data...
   ```

---

## 🔧 Update Frontend to Use Railway Backend

### For Netlify:

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Find `NEXT_PUBLIC_API_URL`
5. Update to your Railway backend URL:
   ```
   https://your-backend.up.railway.app
   ```
6. **Important:** No trailing slash!
7. Go to **Deploys** tab → **Trigger deploy** → **Deploy site**

### For Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_API_URL`
5. Update to your Railway backend URL:
   ```
   https://your-backend.up.railway.app
   ```
6. Go to **Deployments** tab → Click **⋯** → **Redeploy**

---

## 📝 Environment Variables Reference

### FastAPI Backend Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | MongoDB connection string |
| `OPENWEATHER_API_KEY` | ❌ No | Weather API access |
| `PLANT_ID_API_KEY` | ❌ No | Plant identification |
| `PLANTNET_API_KEY` | ❌ No | Plant identification (alternative) |
| `NASA_POWER_API_KEY` | ❌ No | Soil/weather data |
| `OPENLANDMAP_API_KEY` | ❌ No | Land mapping |
| `ONESOIL_API_KEY` | ❌ No | Soil analysis |
| `OPENAI_API_KEY` | ❌ No | AI voice chat |
| `WHATSAPP_ACCESS_TOKEN` | ❌ No | WhatsApp bot |
| `WHATSAPP_PHONE_NUMBER_ID` | ❌ No | WhatsApp bot |
| `WHATSAPP_VERIFY_TOKEN` | ❌ No | WhatsApp bot |
| `WEBHOOK_URL` | ❌ No | WhatsApp webhook URL |

### MQTT Worker Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | MongoDB connection string |
| `MQTT_BROKER_URL` | ❌ No | MQTT broker URL (if using env vars) |
| `MQTT_USERNAME` | ❌ No | MQTT username (if using env vars) |
| `MQTT_PASSWORD` | ❌ No | MQTT password (if using env vars) |
| `MQTT_PORT` | ❌ No | MQTT port (if using env vars) |

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Service fails to start or keeps restarting

**Solutions:**
1. Check **"Logs"** tab for error messages
2. Verify `DATABASE_URL` is correct and includes database name
3. Check MongoDB Atlas Network Access (allow `0.0.0.0/0` for testing)
4. Verify `Dockerfile.railway` exists and is correct
5. Check if `requirements.txt` has all dependencies

### CORS Errors

**Problem:** Frontend can't connect to backend (CORS errors)

**Solutions:**
1. Your FastAPI backend already allows all origins (`allow_origins=["*"]`)
2. Verify backend is running (check logs)
3. Check backend URL is correct in frontend env vars
4. Make sure no trailing slash in `NEXT_PUBLIC_API_URL`

### Port Binding Error

**Problem:** `Address already in use` or port errors

**Solutions:**
1. Railway sets `$PORT` automatically - don't hardcode ports
2. Verify `Dockerfile.railway` uses `${PORT:-8000}` in CMD
3. Railway handles port assignment automatically

### Database Connection Failed

**Problem:** `Can't reach database server` or `P1001` errors

**Solutions:**
1. Check MongoDB Atlas **Network Access**
   - Add `0.0.0.0/0` (allow from anywhere) for testing
2. Verify `DATABASE_URL` format:
   - Should include database name: `...mongodb.net/krishi-mithr?...`
   - Should include `?retryWrites=true&w=majority` or `?appName=Cluster0`
3. Check MongoDB Atlas **Database Access**
   - User should have read/write permissions

### MQTT Worker Not Connecting

**Problem:** Worker can't connect to MQTT broker

**Solutions:**
1. Check MQTT broker URL is correct
2. Verify MQTT credentials (username/password)
3. Check if broker allows connections from Railway IPs
4. Review worker logs for specific error messages

### Build Fails

**Problem:** Docker build fails

**Solutions:**
1. Check `Dockerfile.railway` exists
2. Verify `requirements.txt` exists (not `.bak`)
3. Check build logs for specific errors
4. Ensure Python version in Dockerfile matches your code

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend service is running (green status in Railway)
- [ ] Backend health endpoint works: `/health`
- [ ] Backend root endpoint works: `/`
- [ ] Frontend `NEXT_PUBLIC_API_URL` updated to Railway URL
- [ ] Frontend redeployed after env var update
- [ ] No CORS errors in browser console
- [ ] Login/signup works from frontend
- [ ] MQTT worker connected (if deployed)
- [ ] MongoDB Atlas allows connections from Railway

---

## 🎯 Quick Reference

### Railway Dashboard Locations

- **Projects:** Main dashboard
- **Services:** Click on project → See all services
- **Variables:** Click service → **Variables** tab
- **Logs:** Click service → **Logs** tab
- **Settings:** Click service → **Settings** tab
- **Networking:** Click service → **Settings** → **Networking**
- **Deployments:** Click service → **Deployments** tab

### Important URLs

After deployment:
- **Backend:** `https://your-backend.up.railway.app`
- **Backend Health:** `https://your-backend.up.railway.app/health`
- **Frontend:** Your Netlify/Vercel URL

### Railway Free Tier

- ✅ **$5 free credit per month**
- ✅ **500 hours of usage** (shared across services)
- ✅ **Auto-pauses** if you exceed (no charges)
- ✅ **No credit card required** initially

---

## 🚀 Next Steps

1. ✅ Backend deployed on Railway
2. ✅ MQTT worker deployed (if needed)
3. ✅ Frontend updated with Railway backend URL
4. ✅ Test all features
5. ✅ Monitor logs for any issues
6. ✅ Set up custom domain (optional)
7. ✅ Configure additional API keys as needed

---

## 📚 Additional Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app

---

**🎉 Congratulations! Your backend is now deployed on Railway!**

