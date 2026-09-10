# 🔧 Render Deployment Fix

## Issue: PYTHON_VERSION Error

**Error:** `The PYTHON_VERSION must provide a major, minor, and patch version, e.g. 3.8.1`

## ✅ Solution

### Option 1: Set PYTHON_VERSION in Environment Variables

In Render Dashboard → Environment Variables, add:

```
PYTHON_VERSION=3.11.9
```

Or use:
```
PYTHON_VERSION=3.10.12
```

### Option 2: Use runtime.txt file (Recommended)

The `runtime.txt` file should contain the full version. Update it to:

```
python-3.11.9
```

Or:
```
python-3.10.12
```

## 📋 Complete Environment Variables for Render

Make sure you have these set:

```bash
PYTHON_VERSION=3.11.9
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=kissan_verification_token
OPENWEATHER_API_KEY=your_openweather_api_key_here
WEBHOOK_URL=https://your-render-app.onrender.com/api/webhook/whatsapp
```

## 🔧 Build & Start Commands

**Build Command:**
```
pip install -r requirements.txt
```

**Start Command:**
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

