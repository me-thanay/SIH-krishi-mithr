# 🚂 Railway Quick Start (5 Minutes)

## Step 1: Sign Up & Create Project

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign up with **GitHub**
4. Click **"New Project"** → **"Deploy from GitHub repo"**
5. Select your repository: `SIH-krishi-mithr`

## Step 2: Deploy Backend

Railway will automatically:
- ✅ Detect `railway.json` and `Dockerfile.railway`
- ✅ Create a service
- ✅ Start building

**Just wait for the build to complete!**

## Step 3: Add Environment Variables

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**
4. Add this:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

5. Railway will auto-redeploy

## Step 4: Get Your Backend URL

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"** (if needed)
3. Copy your URL: `https://your-backend.up.railway.app`

## Step 5: Update Frontend

### For Netlify:
1. Netlify Dashboard → **Site settings** → **Environment variables**
2. Update `NEXT_PUBLIC_API_URL` to your Railway URL
3. **Deploys** → **Trigger deploy**

### For Vercel:
1. Vercel Dashboard → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_API_URL` to your Railway URL
3. **Deployments** → **Redeploy**

## ✅ Done!

Your backend is now on Railway. Test it:
- Health: `https://your-backend.up.railway.app/health`
- Should see: `{"status": "healthy"}`

---

## 🆘 Need Help?

See **RAILWAY_DEPLOYMENT_COMPLETE.md** for detailed instructions.
