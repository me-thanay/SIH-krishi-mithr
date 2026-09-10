# 🆓 Free Tier Alternatives for MQTT Service

## ⚠️ Issue: Render Background Workers Require Paid Plan

Render's **Background Workers** now require a paid plan (minimum $7/month). The free tier is only available for **Web Services**, not workers.

## ✅ Solution Options (All FREE)

### Option 1: Railway (Recommended - 100% Free)

Railway offers free tier for background workers!

#### Setup Steps:

1. **Go to [Railway](https://railway.app)**
2. **Sign up** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**: `SIH-krishi-mithr`

#### Configure Service:

1. **Add Service** → **"Empty Service"**
2. **Settings** → **"Generate Domain"** (optional)
3. **Variables** tab → Add:
   ```
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
4. **Settings** → **"Build Command"**:
   ```bash
   pip install -r requirements_mqtt.txt
   ```
5. **Settings** → **"Start Command"**:
   ```bash
   python mqtt_to_mongodb_krishimithr.py
   ```

#### Railway Free Tier:
- ✅ $5 free credit monthly
- ✅ Enough for background workers
- ✅ No payment info required initially
- ✅ Auto-scales

---

### Option 2: Fly.io (100% Free)

Fly.io has generous free tier!

#### Setup Steps:

1. **Install Fly CLI**:
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Sign up**: `fly auth signup`

3. **Create app**:
   ```bash
   fly launch --no-deploy
   ```

4. **Create `fly.toml`**:
   ```toml
   app = "krishi-mithr-mqtt"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"

   [env]
     DATABASE_URL = "mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0"

   [[services]]
     internal_port = 8080
     protocol = "tcp"
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

#### Fly.io Free Tier:
- ✅ 3 shared-cpu VMs
- ✅ 3GB persistent volumes
- ✅ 160GB outbound data transfer
- ✅ Perfect for background workers

---

### Option 3: Render Web Service (Free - Workaround)

Convert worker to a web service that stays alive!

#### Create a Simple Web Service:

1. **Create new file**: `mqtt_web_service.py`

```python
from flask import Flask
import threading
from mqtt_to_mongodb_krishimithr import *

app = Flask(__name__)

@app.route('/')
def health():
    return {"status": "ok", "service": "mqtt-worker"}

@app.route('/health')
def health_check():
    return {"status": "healthy"}

if __name__ == '__main__':
    # Start MQTT in background thread
    threading.Thread(target=start_mqtt_service, daemon=True).start()
    # Run Flask web server
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
```

2. **Deploy as Web Service** (free tier available!)

---

### Option 4: Run Locally (100% Free)

Keep your computer running and run the script:

```bash
python mqtt_to_mongodb_krishimithr.py
```

**Pros:**
- ✅ 100% free
- ✅ Full control

**Cons:**
- ⚠️ Requires your computer to be on 24/7
- ⚠️ Not ideal for production

---

### Option 5: PythonAnywhere (Free Tier)

PythonAnywhere offers free tier for Python scripts!

#### Setup:

1. **Sign up**: [pythonanywhere.com](https://www.pythonanywhere.com)
2. **Upload files** via web interface
3. **Schedule task** to run continuously
4. **Free tier**: Limited but works!

---

## 🎯 Recommended: Railway

**Why Railway:**
- ✅ Free tier available
- ✅ Easy setup
- ✅ No payment info needed initially
- ✅ Good documentation
- ✅ Reliable service

## 📋 Quick Comparison

| Service | Free Tier | Payment Info | Ease of Setup |
|---------|-----------|--------------|---------------|
| **Railway** | ✅ Yes ($5/month credit) | ❌ Not required | ⭐⭐⭐⭐⭐ |
| **Fly.io** | ✅ Yes (generous) | ❌ Not required | ⭐⭐⭐⭐ |
| **Render Worker** | ❌ No (paid only) | ✅ Required | ⭐⭐⭐ |
| **Render Web** | ✅ Yes | ❌ Not required | ⭐⭐⭐ |
| **Local** | ✅ Yes | N/A | ⭐⭐⭐⭐⭐ |

## 🚀 Quick Start: Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. New Project → GitHub repo
4. Add environment variable: `DATABASE_URL`
5. Set build command: `pip install -r requirements_mqtt.txt`
6. Set start command: `python mqtt_to_mongodb_krishimithr.py`
7. Deploy!

**Total time: 5 minutes** ⚡

---

## 💡 Alternative: Use Render Web Service

If you want to stay on Render, we can convert the worker to a web service (which has free tier). Let me know if you want this option!

