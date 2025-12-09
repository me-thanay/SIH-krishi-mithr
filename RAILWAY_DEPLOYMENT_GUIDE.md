# 🚂 Railway Deployment Guide - Backend & MQTT Worker

This guide will help you deploy your **Krishi Mithr** backend services (FastAPI Backend + MQTT Worker) on Railway.

**Note:** Your frontend is already deployed on Vercel, so this guide focuses only on backend services.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Account Setup](#railway-account-setup)
3. [Deployment Architecture](#deployment-architecture)
4. [Service 1: FastAPI Backend](#service-1-fastapi-backend)
5. [Service 2: MQTT Worker (Optional)](#service-2-mqtt-worker-optional)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment](#post-deployment)
8. [Update Vercel Frontend](#update-vercel-frontend)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ GitHub account with your repository
- ✅ MongoDB Atlas database (or connection string)
- ✅ Railway account (free tier available)
- ✅ Frontend deployed on Vercel
- ✅ API keys (optional, for full functionality)

---

## Railway Account Setup

### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended for easy deployment)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"** in Railway dashboard
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `SIH-krishi-mithr-main` (or your repo name)
4. Railway will create a project and detect your codebase

---

## Deployment Architecture

You'll deploy **2 services** on Railway:

1. **FastAPI Backend** - Main API server (replaces Render backend)
2. **MQTT Worker** - Background service for sensor data (optional)

**Frontend:** Already deployed on Vercel (no changes needed to Railway)

---

## Service 1: FastAPI Backend

### Step 1: Create Backend Service

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Railway will create a new service

### Step 2: Configure Backend Service

1. Click on the service to open settings
2. Go to **"Settings"** tab
3. Configure the following:

#### **Build Command:**
```bash
pip install -r requirements.txt
```

#### **Start Command:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Note:** Railway automatically sets `$PORT` environment variable.

### Step 3: Add Environment Variables

Go to **"Variables"** tab and add:

#### **Required Variables:**

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

#### **Optional Variables (for full functionality):**

```bash
# Weather API
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Agricultural APIs
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
NASA_POWER_API_KEY=your_nasa_power_api_key_here
OPENLANDMAP_API_KEY=your_openlandmap_api_key_here
ONESOIL_API_KEY=your_onesoil_api_key_here

# Voice & AI
OPENAI_API_KEY=your_openai_api_key_here

# WhatsApp (if using)
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=kissan_verification_token
WEBHOOK_URL=https://your-backend-url.railway.app/api/webhook/whatsapp
```

### Step 4: Deploy Backend

1. Railway will automatically deploy after you save settings
2. Wait for deployment to complete
3. Check **"Deployments"** tab for status
4. Once deployed, note your backend URL (e.g., `https://your-backend.railway.app`)

### Step 5: Verify Backend

1. Open **"Logs"** tab to see startup logs
2. Visit `https://your-backend.railway.app/health` in browser
3. Should see: `{"status": "healthy", "message": "All services operational"}`

---

## Service 2: MQTT Worker (Optional)

This service processes MQTT sensor data and stores it in MongoDB.

### Step 1: Create Worker Service

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Railway will create a new service

### Step 2: Configure Worker Service

1. Click on the service to open settings
2. Go to **"Settings"** tab
3. Configure the following:

#### **Build Command:**
```bash
pip install -r requirements_mqtt.txt
```

#### **Start Command:**
```bash
python mqtt_to_mongodb_krishimithr.py
```

### Step 3: Add Environment Variables

Go to **"Variables"** tab and add:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

**Note:** If your MQTT script requires additional environment variables (like MQTT broker URL, username, password), add them here.

### Step 4: Deploy Worker

1. Railway will automatically deploy after you save settings
2. Wait for deployment to complete
3. Check **"Deployments"** tab for status

### Step 5: Verify Worker

1. Open **"Logs"** tab
2. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Connected to MQTT broker
   📡 Subscribed to topic: krishimithr/sensor/data
   ⏳ Waiting for sensor data...
   ```

---

## Environment Variables Summary

### FastAPI Backend Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | MongoDB connection string |
| `OPENWEATHER_API_KEY` | ❌ No | Weather API access |
| `PLANT_ID_API_KEY` | ❌ No | Plant identification |
| `OPENAI_API_KEY` | ❌ No | AI voice chat |
| `WHATSAPP_*` | ❌ No | WhatsApp bot (if using) |

### MQTT Worker Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | MongoDB connection string |

---

## Post-Deployment

### 1. Update CORS Settings

After deployment, update CORS in your FastAPI backend to include your Vercel frontend URLs:

1. Edit `app/main.py`
2. Your Vercel URLs should already be in `allowed_origins` (the code uses `["*"]` which allows all origins)
3. If you want to be more specific, add your Vercel URLs:
   ```python
   allowed_origins = [
       "https://sih-krishi-mithr.vercel.app",
       "https://sih-krishi-mithr-g9tt.vercel.app",
       # Add your specific Vercel URLs here
       # ... other origins
   ]
   ```
4. Redeploy the backend service if you made changes

### 2. Test Your Backend

1. **Backend Health:** Visit `https://your-backend.railway.app/health`
   - Should see: `{"status": "healthy", "message": "All services operational"}`
2. **API Root:** Visit `https://your-backend.railway.app/`
   - Should see API information
3. **Test CORS:** Visit `https://your-backend.railway.app/api/test-cors`

### 3. Custom Domain (Optional)

1. Go to your service settings
2. Click **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** or add custom domain
4. Railway will provide SSL certificate automatically

---

## Update Vercel Frontend

After deploying your backend on Railway, you need to update your Vercel frontend to use the new Railway backend URL.

### Step 1: Get Your Railway Backend URL

1. Go to Railway dashboard
2. Click on your backend service
3. Go to **"Settings"** → **"Networking"**
4. Copy your service URL (e.g., `https://your-backend.railway.app`)

### Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Find `NEXT_PUBLIC_API_URL`
5. Click **Edit**
6. Update the value to your Railway backend URL:
   ```
   https://your-backend.railway.app
   ```
   **Important:** No trailing slash!
7. Make sure it's enabled for: **Production**, **Preview**, **Development**
8. Click **Save**

### Step 3: Redeploy Vercel

1. Go to **"Deployments"** tab in Vercel
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for deployment to complete

### Step 4: Verify Connection

1. Visit your Vercel frontend URL
2. Open browser console (F12)
3. Test API connection:
   ```javascript
   fetch('https://your-backend.railway.app/health')
     .then(r => r.json())
     .then(console.log)
   ```
4. Should see: `{status: "healthy", message: "All services operational"}`

---

## Troubleshooting

### Backend Issues

**Problem:** Service fails to start
- ✅ Check **"Logs"** tab for error messages
- ✅ Verify `DATABASE_URL` is correct
- ✅ Ensure `requirements.txt` has all dependencies
- ✅ Check build command installed dependencies

**Problem:** CORS errors
- ✅ Add frontend URL to `allowed_origins` in `app/main.py`
- ✅ Redeploy backend service

**Problem:** Port binding error
- ✅ Ensure start command uses `$PORT` variable
- ✅ Railway sets `$PORT` automatically

### Vercel Frontend Issues

**Problem:** API calls fail from Vercel
- ✅ Verify `NEXT_PUBLIC_API_URL` in Vercel points to Railway backend URL
- ✅ Check Railway backend service is running
- ✅ Verify CORS is configured on Railway backend (should allow all origins)
- ✅ Check browser console for CORS errors
- ✅ Ensure no trailing slash in `NEXT_PUBLIC_API_URL`

**Problem:** 500 errors on login/signup
- ✅ Verify `DATABASE_URL` is set in Vercel
- ✅ Verify `JWT_SECRET` is set in Vercel
- ✅ Check MongoDB Atlas network access allows Vercel IPs
- ✅ Check Vercel deployment logs for errors

### MQTT Worker Issues

**Problem:** Worker not connecting to MQTT
- ✅ Check MQTT broker credentials in your script
- ✅ Verify network access to MQTT broker
- ✅ Check logs for connection errors

**Problem:** MongoDB connection fails
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check MongoDB Atlas network access (allow Railway IPs)

### General Issues

**Problem:** Service keeps restarting
- ✅ Check **"Logs"** for crash errors
- ✅ Verify all required environment variables are set
- ✅ Check resource limits (Railway free tier has limits)

**Problem:** Slow deployments
- ✅ Normal for first deployment (installing dependencies)
- ✅ Subsequent deployments are faster
- ✅ Check build logs for bottlenecks

---

## Railway Free Tier Limits

- ✅ **$5 free credit per month**
- ✅ **500 hours of usage** (shared across services)
- ✅ **Auto-pauses** if you exceed (no charges)
- ✅ **No credit card required** initially

**Note:** For production, consider Railway's paid plans for better performance and reliability.

---

## Quick Reference: Service URLs

After deployment, you'll have:

- **Frontend:** `https://your-vercel-app.vercel.app` (on Vercel)
- **Backend:** `https://your-backend.railway.app` (on Railway)
- **Backend Health:** `https://your-backend.railway.app/health`
- **API Root:** `https://your-backend.railway.app/`

---

## Next Steps

1. ✅ Backend deployed on Railway
2. ✅ MQTT worker deployed (if needed)
3. ✅ Vercel frontend updated with Railway backend URL
4. ✅ Test all features
5. ✅ Set up custom domains (optional)
6. ✅ Monitor logs for any issues
7. ✅ Configure additional API keys as needed

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app

---

**🎉 Congratulations! Your application is now deployed on Railway!**

