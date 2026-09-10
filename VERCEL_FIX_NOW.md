# 🔴 URGENT FIX: Update Vercel Environment Variable

## The Problem
Your Vercel deployment is trying to access:
- ❌ `https://sih-krishi-mithr-api.onrender.com` (WRONG - doesn't exist)

But your actual backend is at:
- ✅ `https://sih-krishi-mithr.onrender.com` (CORRECT)

## Quick Fix (2 minutes)

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project: `krishi-mithr` or `SIH-krishi-mithr`

### Step 2: Update Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_API_URL`
3. Click **Edit** (or delete and recreate)
4. Change the value to:
   ```
   https://sih-krishi-mithr.onrender.com
   ```
   (NO `-api` in the URL!)
5. Make sure it's enabled for: **Production**, **Preview**, **Development**
6. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for deployment to complete

## Verify It's Fixed

After redeployment, open your Vercel app and check the browser console. The errors should be gone!

## All Environment Variables (Complete List)

Make sure you have ALL 3 variables set correctly:

### 1. DATABASE_URL
```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### 2. JWT_SECRET
```
14ecab3bd43e8b60498500109968a08a266813bcbc8b7a80a66556150a9eeb17
```

### 3. NEXT_PUBLIC_API_URL ⚠️ (THIS IS THE ONE TO FIX)
```
https://sih-krishi-mithr.onrender.com
```
**NOT** `https://sih-krishi-mithr-api.onrender.com` ❌

## Test After Fix

Open browser console on your Vercel app and run:
```javascript
fetch('https://sih-krishi-mithr.onrender.com/api/market-prices?location=Telangana')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

You should see market prices data, not CORS errors!


































