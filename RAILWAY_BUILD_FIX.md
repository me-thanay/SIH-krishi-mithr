# 🔧 Railway Build Error Fix

## Problem

Railway is trying to use Nixpacks but getting this error:
```
error: undefined variable 'pip'
```

This happens because Railway auto-detects the build system but the configuration is incorrect.

---

## Solution Options

### Option 1: Use Docker (Recommended) ✅

Railway can use Docker instead of Nixpacks. This is more reliable.

#### For FastAPI Backend:

1. **Create a Dockerfile** (already created: `Dockerfile.railway`)
2. In Railway service settings:
   - Go to **Settings** tab
   - Find **"Dockerfile Path"** or **"Build Configuration"**
   - Set to: `Dockerfile.railway`
   - OR Railway might auto-detect it

#### For MQTT Worker:

1. Use `Dockerfile.railway.mqtt` (already created)
2. Set Dockerfile path to: `Dockerfile.railway.mqtt`

---

### Option 2: Fix Nixpacks Configuration

I've updated `nixpacks.toml` to use Python 3.11 properly. However, **Docker is recommended** as it's more reliable.

---

### Option 3: Configure Railway to Use Docker

1. Go to Railway service → **Settings** tab
2. Look for **"Build Configuration"** or **"Builder"** option
3. Change from **"Nixpacks"** to **"Dockerfile"**
4. Set Dockerfile path if needed

---

## Step-by-Step: Switch to Docker

### For Backend Service:

1. **Go to Railway Dashboard**
2. **Click on your backend service**
3. **Go to Settings tab**
4. **Look for one of these options:**
   - "Dockerfile Path"
   - "Build Configuration"
   - "Builder" (change to Dockerfile)
   - "Use Dockerfile" checkbox

5. **If you see "Dockerfile Path" field:**
   - Enter: `Dockerfile.railway`
   - Save

6. **If you see "Builder" dropdown:**
   - Change from "Nixpacks" to "Dockerfile"
   - Set path to: `Dockerfile.railway`
   - Save

7. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"Redeploy"** or Railway will auto-redeploy

---

### For MQTT Worker Service:

Same steps, but use:
- Dockerfile path: `Dockerfile.railway.mqtt`

---

## Alternative: Delete railway.json

If Railway keeps trying to use Nixpacks, you can:

1. **Temporarily rename or delete** `railway.json`
2. Railway will then try to auto-detect
3. It should detect the Dockerfile
4. Or manually configure Docker in settings

**Note:** You can always restore `railway.json` later if needed.

---

## Verify Docker Build

After switching to Docker:

1. **Go to Deployments tab**
2. **Click on the latest deployment**
3. **Check the build logs**
4. You should see:
   ```
   Step 1/7 : FROM python:3.11-slim
   Step 2/7 : WORKDIR /app
   ...
   ```
5. Build should complete successfully

---

## If Docker Still Doesn't Work

### Check Dockerfile Location:

1. Make sure `Dockerfile.railway` is in the **root directory** of your repo
2. Railway should be able to find it

### Manual Dockerfile Path:

If Railway doesn't auto-detect:
1. Go to Settings
2. Find "Dockerfile Path" or similar
3. Enter: `Dockerfile.railway` (exact filename)
4. Save

### Use Standard Dockerfile Name:

You can also rename:
- `Dockerfile.railway` → `Dockerfile` (for backend)
- Railway will auto-detect `Dockerfile`

**Note:** If you have multiple services, you might need different Dockerfiles or use the path option.

---

## Quick Fix Summary

1. ✅ Dockerfiles created: `Dockerfile.railway` and `Dockerfile.railway.mqtt`
2. ✅ `nixpacks.toml` updated (but Docker is better)
3. ⚠️ **Action needed:** Configure Railway to use Docker instead of Nixpacks

---

## Still Having Issues?

If you still get build errors:

1. **Check Railway logs** for specific error messages
2. **Verify Dockerfile syntax** is correct
3. **Make sure requirements.txt exists** and is valid
4. **Check that Python packages in requirements.txt are valid**

---

**The Dockerfile approach is more reliable than Nixpacks for Python applications!**

