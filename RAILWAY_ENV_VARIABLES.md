# 🔐 Railway Environment Variables Template

Copy and paste these environment variables into Railway for backend services.

**Note:** Frontend is deployed on Vercel, so only backend services need Railway environment variables.

---

## 🔴 Service 1: FastAPI Backend

### Required Variables:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### Optional Variables (for full functionality):

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
WEBHOOK_URL=https://your-backend-url.railway.app/api/webhook/whatsapp
```

**Note:** Update `WEBHOOK_URL` after you get your backend URL from Railway.

---

## 🔵 Service 2: MQTT Worker (Optional)

### Required Variables:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### Additional MQTT Variables (if needed):

If your MQTT script requires broker credentials, add:

```bash
MQTT_BROKER_URL=your_mqtt_broker_url
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MQTT_PORT=1883
```

---

## 📋 How to Add Variables in Railway

1. Go to your Railway project
2. Click on the service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Enter **Key** and **Value**
6. Click **"Add"**
7. Railway will automatically redeploy

---

## ✅ Quick Checklist

### Backend Service (Railway):
- [ ] `DATABASE_URL` is set
- [ ] (Optional) API keys added as needed

### MQTT Worker Service (Railway):
- [ ] `DATABASE_URL` is set
- [ ] (Optional) MQTT broker credentials if needed

### Frontend Service (Vercel):
- [ ] `DATABASE_URL` is set
- [ ] `JWT_SECRET` is set (generated securely)
- [ ] `NEXT_PUBLIC_API_URL` is set to Railway backend URL (no trailing slash!)
- [ ] `NODE_ENV=production` is set

---

## 🔑 Generate JWT Secret

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Using OpenSSL:**
```bash
openssl rand -hex 64
```

**Using Python:**
```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

Copy the output and use it as your `JWT_SECRET` value.

---

## 🎯 Example Values

### For Testing (Replace with your actual values):

```bash
# Backend (Railway)
DATABASE_URL=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/krishi-mithr?appName=Cluster0

# Frontend (Vercel) - Update these in Vercel Dashboard
DATABASE_URL=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/krishi-mithr?appName=Cluster0
JWT_SECRET=14ecab3bd43e8b60498500109968a08a266813bcbc8b7a80a66556150a9eeb17
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NODE_ENV=production
```

**Note:** Frontend variables should be set in Vercel, not Railway!

---

## ⚠️ Important Notes

1. **Never commit secrets to Git** - Railway and Vercel handle this securely
2. **Update Vercel** after Railway deployment - set `NEXT_PUBLIC_API_URL` to Railway backend URL
3. **No trailing slashes** in URLs (especially `NEXT_PUBLIC_API_URL` in Vercel)
4. **Test each service** after adding variables
5. **Check logs** if something doesn't work
6. **Backend CORS** already allows all origins (`["*"]`), so Vercel should work automatically

---

For detailed deployment instructions, see: **RAILWAY_DEPLOYMENT_GUIDE.md**

