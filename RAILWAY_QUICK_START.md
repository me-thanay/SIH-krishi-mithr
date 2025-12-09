# 🚀 Railway Quick Start Checklist

Follow this checklist to deploy your backend services quickly on Railway.

**Note:** Your frontend is already deployed on Vercel, so this guide focuses on backend deployment.

## ✅ Pre-Deployment Checklist

- [ ] GitHub repository is ready
- [ ] MongoDB Atlas database is set up
- [ ] Railway account created (railway.app)
- [ ] Frontend already deployed on Vercel

---

## 🚂 Deployment Steps

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### Step 2: Deploy Backend (FastAPI)

1. Click **"+ New"** → **"GitHub Repo"** (same repo)
2. **Settings** → **Build Command:**
   ```
   pip install -r requirements.txt
   ```
3. **Settings** → **Start Command:**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. **Variables** → Add:
   ```
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
5. Wait for deployment
6. **Copy the service URL** (e.g., `https://xxx.railway.app`) - **You'll need this for Vercel!**

### Step 3: Deploy MQTT Worker (Optional)

1. Click **"+ New"** → **"GitHub Repo"** (same repo)
2. **Settings** → **Build Command:**
   ```
   pip install -r requirements_mqtt.txt
   ```
3. **Settings** → **Start Command:**
   ```
   python mqtt_to_mongodb_krishimithr.py
   ```
4. **Variables** → Add:
   ```
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
5. Wait for deployment

### Step 4: Update Vercel Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Find `NEXT_PUBLIC_API_URL`
5. Click **Edit**
6. Update to your Railway backend URL:
   ```
   https://your-backend.railway.app
   ```
   **Important:** No trailing slash!
7. Click **Save**
8. Go to **"Deployments"** → Click **⋯** → **Redeploy**

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.railway.app/health`
- [ ] Vercel frontend updated with Railway backend URL
- [ ] Vercel redeployed
- [ ] Test login/signup functionality on Vercel
- [ ] Check logs for any errors
- [ ] CORS should work (backend uses `allow_origins=["*"]`)

---

## 🔧 Verify CORS (Optional)

Your backend already uses `allow_origins=["*"]` which allows all origins, so Vercel should work automatically. If you want to be more specific:

1. Edit `app/main.py`
2. Update `allowed_origins` to include your Vercel URLs:
   ```python
   allowed_origins = [
       "https://sih-krishi-mithr.vercel.app",
       "https://sih-krishi-mithr-g9tt.vercel.app",
       # Add your specific Vercel URLs
   ]
   ```
3. Redeploy backend service

---

## 📊 Service URLs Reference

After deployment, save these URLs:

- **Frontend:** `https://________________.vercel.app` (on Vercel)
- **Backend:** `https://________________.railway.app` (on Railway)
- **Backend Health:** `https://________________.railway.app/health`

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check Railway logs, verify environment variables |
| CORS errors | Backend uses `["*"]` so should work. Check Vercel `NEXT_PUBLIC_API_URL` |
| API not working from Vercel | Verify `NEXT_PUBLIC_API_URL` in Vercel points to Railway URL (no trailing slash) |
| Database errors | Check `DATABASE_URL` is correct in Railway |
| Service restarting | Check Railway logs for crash errors |
| Vercel can't connect | Update `NEXT_PUBLIC_API_URL` in Vercel to Railway backend URL |

---

## 📚 Full Documentation

For detailed instructions, see: **RAILWAY_DEPLOYMENT_GUIDE.md**

---

**Total deployment time: ~15-20 minutes** ⚡

