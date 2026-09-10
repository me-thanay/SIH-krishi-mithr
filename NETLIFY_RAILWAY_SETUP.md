# 🚀 Complete Setup: Netlify (Frontend) + Railway (Backend)

This guide will help you deploy your **Krishi Mithr** application with:
- **Frontend:** Netlify (Next.js)
- **Backend:** Railway (FastAPI)

---

## 📋 Prerequisites

- ✅ GitHub repository with your code
- ✅ MongoDB Atlas database
- ✅ Netlify account (free)
- ✅ Railway account (free tier available)

---

## Part 1: Deploy Backend on Railway

### Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub**
4. Authorize Railway to access your repositories

### Step 2: Create Railway Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository: `SIH-krishi-mithr`
4. Railway will create a project and detect your code

### Step 3: Configure Backend Service

Railway will automatically:
- ✅ Detect `railway.json` and `Dockerfile.railway`
- ✅ Create a service
- ✅ Start building

**No manual configuration needed!**

### Step 4: Add Environment Variables

1. Click on your backend service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add these variables:

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

5. Railway will automatically redeploy after you save

### Step 5: Get Your Railway Backend URL

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** (if not already generated)
3. Copy your Railway URL: `https://your-backend.up.railway.app`
4. **Save this URL** - you'll need it for Netlify!

### Step 6: Verify Backend is Working

1. Test in browser:
   - Health: `https://your-backend.up.railway.app/health`
   - Should see: `{"status": "healthy", "message": "All services operational"}`

2. Check logs:
   - Go to **"Logs"** tab
   - Should see: `INFO: Uvicorn running on http://0.0.0.0:PORT`

---

## Part 2: Deploy Frontend on Netlify

### Step 1: Sign Up for Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **"Sign up"**
3. Sign up with **GitHub** (recommended)

### Step 2: Create New Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Authorize Netlify to access your repositories
4. Select your repository: `SIH-krishi-mithr`

### Step 3: Configure Build Settings

Netlify should auto-detect Next.js, but verify:

**Build command:**
```bash
npm run build
```

**Publish directory:**
```
.next
```

**Note:** Netlify will use `netlify.toml` if present, which already has these settings.

### Step 4: Add Environment Variables

**CRITICAL:** These are required for your Next.js API routes (`/api/auth/login`, `/api/auth/signup`)

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add these variables:

**Required for Authentication:**
```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

```bash
JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
```

**Required for Backend API Calls:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

**Important:** Replace `your-backend.up.railway.app` with your actual Railway backend URL!

**Optional (if using external APIs):**
```bash
OPENWEATHER_API_KEY=your_openweather_api_key_here
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Set for All Environments**
   - When adding each variable, select:
     - ✅ **Production**
     - ✅ **Deploy previews**
     - ✅ **Branch deploys**

### Step 5: Deploy

1. Click **"Deploy site"**
2. Netlify will start building
3. Wait 2-5 minutes for deployment to complete
4. You'll get a URL like: `https://your-site.netlify.app`

### Step 6: Verify Deployment

1. Check **Deploys** tab
   - Should see: `✔ Build successful`
   - Should see: `✔ Generated Prisma Client`

2. Visit your Netlify URL
   - Should see your app loading

3. Test login
   - Try logging in with phone + face photo
   - Should work without 500 errors

---

## Part 3: Update CORS on Railway Backend

After deploying both, update CORS to allow your Netlify domain:

### Option 1: Update FastAPI CORS (Recommended)

1. Edit `app/main.py` in your repository
2. Add your Netlify URL to `allowed_origins`:

```python
allowed_origins = [
    "https://your-site.netlify.app",  # Add your Netlify URL
    "https://your-site--*.netlify.app",  # For preview deployments
    "http://localhost:3000",
    "http://localhost:8000",
]
```

3. Commit and push:
```bash
git add app/main.py
git commit -m "Update CORS for Netlify"
git push
```

4. Railway will automatically redeploy

### Option 2: Keep CORS Open (Easier for Testing)

Your FastAPI backend already uses `allow_origins=["*"]` which allows all origins. This works for testing but consider restricting it for production.

---

## Part 4: MQTT Worker (Optional)

If you need the MQTT worker:

### Step 1: Create Worker Service

1. In Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select the same repository
3. Railway will create a new service

### Step 2: Configure Worker

1. Click on the service
2. Go to **"Settings"** tab
3. Railway should auto-detect `railway.mqtt.json`
4. If not, set Dockerfile path: `Dockerfile.railway.mqtt`

### Step 3: Add Environment Variables

Go to **"Variables"** tab and add:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

**MQTT Configuration (if using env vars):**
```bash
MQTT_BROKER_URL=broker.hivemq.com
MQTT_USERNAME=krishi1
MQTT_PASSWORD=krishi1
MQTT_PORT=1883
MQTT_PUBLISH_TOPIC=krishimithr/sensor/data
MQTT_SUB_TOPIC=krishimithr/device/cmd
```

### Step 4: Verify Worker

1. Go to **"Logs"** tab
2. Should see:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Connected to MQTT broker
   📡 Subscribed to topic: krishimithr/sensor/data
   ```

---

## 📝 Environment Variables Summary

### Railway Backend Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | MongoDB connection string |
| `OPENWEATHER_API_KEY` | ❌ No | Weather API access |
| `PLANT_ID_API_KEY` | ❌ No | Plant identification |
| `OPENAI_API_KEY` | ❌ No | AI voice chat |
| `WHATSAPP_*` | ❌ No | WhatsApp bot (if using) |

### Netlify Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | MongoDB connection (for Next.js API routes) |
| `JWT_SECRET` | ✅ Yes | JWT secret (for authentication) |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Railway backend URL |
| `OPENWEATHER_API_KEY` | ❌ No | Weather API (if using) |
| `PLANT_ID_API_KEY` | ❌ No | Plant identification (if using) |

---

## 🔍 Troubleshooting

### Frontend Login Returns 500

**Problem:** `/api/auth/login` returns 500 error

**Solutions:**
1. ✅ Verify `DATABASE_URL` is set in Netlify
2. ✅ Verify `JWT_SECRET` is set in Netlify
3. ✅ Redeploy Netlify after setting variables
4. ✅ Check MongoDB Atlas Network Access (allow `0.0.0.0/0`)
5. ✅ Check Netlify Function logs for specific errors

### CORS Errors

**Problem:** Frontend can't call Railway backend

**Solutions:**
1. ✅ Verify `NEXT_PUBLIC_API_URL` is set correctly in Netlify
2. ✅ Check Railway backend is running (test `/health` endpoint)
3. ✅ Update CORS in `app/main.py` to include Netlify URL
4. ✅ Redeploy Railway backend after CORS update

### Backend Won't Start on Railway

**Problem:** Railway service fails to start

**Solutions:**
1. ✅ Check **Logs** tab for error messages
2. ✅ Verify `DATABASE_URL` is correct
3. ✅ Check `Dockerfile.railway` exists
4. ✅ Verify `requirements.txt` exists (not `.bak`)

### Netlify Build Fails

**Problem:** Netlify build fails

**Solutions:**
1. ✅ Check build logs for specific errors
2. ✅ Verify `netlify.toml` is correct
3. ✅ Make sure Python files are excluded (`.netlifyignore`)
4. ✅ Check if `requirements.txt` is renamed to `.bak` (should be restored)

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Railway backend is running (green status)
- [ ] Railway backend health endpoint works: `/health`
- [ ] Netlify frontend deployed successfully
- [ ] Netlify environment variables set (`DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`)
- [ ] Netlify redeployed after setting variables
- [ ] Frontend can login without 500 errors
- [ ] Frontend can call Railway backend APIs
- [ ] MongoDB Atlas allows connections from both platforms
- [ ] CORS updated to include Netlify URL (if needed)

---

## 🎯 Quick Reference

### Important URLs

After deployment:
- **Frontend:** `https://your-site.netlify.app` (Netlify)
- **Backend:** `https://your-backend.up.railway.app` (Railway)
- **Backend Health:** `https://your-backend.up.railway.app/health`

### Dashboard Locations

**Railway:**
- Projects → Your project → Services
- Variables: Service → **Variables** tab
- Logs: Service → **Logs** tab
- Networking: Service → **Settings** → **Networking**

**Netlify:**
- Sites → Your site
- Environment Variables: **Site settings** → **Environment variables**
- Deploys: **Deploys** tab
- Functions: **Functions** tab (for API route logs)

---

## 🚀 Next Steps

1. ✅ Backend deployed on Railway
2. ✅ Frontend deployed on Netlify
3. ✅ Environment variables set in both platforms
4. ✅ Test all features
5. ✅ Set up custom domains (optional)
6. ✅ Monitor logs for any issues
7. ✅ Configure additional API keys as needed

---

## 📚 Additional Resources

- **Railway Docs:** https://docs.railway.app
- **Netlify Docs:** https://docs.netlify.com
- **Railway Discord:** https://discord.gg/railway
- **Netlify Community:** https://answers.netlify.com

---

**🎉 Congratulations! Your application is now deployed on Netlify + Railway!**

