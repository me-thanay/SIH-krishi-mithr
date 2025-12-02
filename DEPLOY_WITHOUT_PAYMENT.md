# 🆓 Deploy MQTT Service WITHOUT Payment Information

## ⚠️ Render Blueprint Issue

Render's **Blueprint** feature (using `render.yaml`) requires payment information on file, even for free tier services. However, you can deploy **manually** without payment info!

## ✅ Solution: Manual Deployment (No Payment Required)

### Step 1: Create Background Worker Manually

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button (top right)
3. Select **"Background Worker"** (NOT Blueprint)
4. This method doesn't require payment info!

### Step 2: Connect Repository

1. **Connect GitHub** (if not already connected)
2. **Select your repository**: `SIH-krishi-mithr`
3. **Select branch**: `main`

### Step 3: Configure Service

Fill in these settings:

**Name:**
```
krishi-mithr-mqtt-worker
```

**Environment:**
```
Python 3
```

**Build Command:**
```bash
pip install -r requirements_mqtt.txt
```

**Start Command:**
```bash
python mqtt_to_mongodb_krishimithr.py
```

**Plan:**
- Select **"Free"** plan (should be default)

### Step 4: Add Environment Variable

Click **"Advanced"** → **"Add Environment Variable"**

**Key:** `DATABASE_URL`

**Value:** Your MongoDB connection string
```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### Step 5: Create Service

1. Click **"Create Background Worker"**
2. ✅ **No payment information required!**
3. Service will start building automatically

### Step 6: Verify

1. Wait for build to complete (2-3 minutes)
2. Check **"Logs"** tab
3. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Connected to MQTT broker
   📡 Subscribed to topic: krishimithr/sensor/data
   ```

## 🎯 Why This Works

- **Manual deployment** = No payment info needed
- **Blueprint deployment** = Requires payment info (even for free tier)
- Both methods are **100% free** - you just avoid the payment form!

## ✅ Verification Checklist

- [ ] Service created via "Background Worker" (not Blueprint)
- [ ] Plan shows "Free"
- [ ] `DATABASE_URL` environment variable set
- [ ] Build completed successfully
- [ ] Logs show MQTT connection established
- [ ] Service is running

## 💡 Alternative: Other Free Services

If you want to avoid Render entirely, here are other free options:

### 1. **Railway** (Free Tier)
- Similar to Render
- Free tier available
- No payment info required for free tier

### 2. **Fly.io** (Free Tier)
- Generous free tier
- Good for background workers

### 3. **Replit** (Free Tier)
- Can run Python scripts
- Free tier available

### 4. **PythonAnywhere** (Free Tier)
- Free tier for Python scripts
- Limited but works for MQTT

### 5. **Run on Your Own Computer**
- Keep your computer running
- Run: `python mqtt_to_mongodb_krishimithr.py`
- Free but requires your PC to be on

## 🚀 Recommended: Manual Render Setup

**Best option**: Use Render's manual setup (steps above)
- ✅ 100% free
- ✅ No payment info needed
- ✅ Reliable service
- ✅ Easy to manage

## 📝 Summary

**Problem:** Blueprint requires payment info  
**Solution:** Use Manual Background Worker setup  
**Result:** 100% free, no payment info needed! ✅

---

## 🆘 Still Having Issues?

If Render still asks for payment:
1. Try creating account fresh (new email)
2. Or use Railway/Fly.io alternatives
3. Or run locally on your computer

The service will work the same way regardless of where it runs! 🎉

