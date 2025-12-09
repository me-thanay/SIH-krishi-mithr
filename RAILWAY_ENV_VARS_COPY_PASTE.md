# 🔐 Railway Environment Variables - Copy & Paste

Quick reference for all environment variables needed in Railway.

---

## 🔴 FastAPI Backend Service

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
WEBHOOK_URL=https://your-backend.railway.app/api/webhook/whatsapp
```

**Note:** Update `WEBHOOK_URL` after you get your Railway backend URL.

---

## 🔵 MQTT Worker Service (Optional)

### Required Variables:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### Additional MQTT Variables (if your script needs them):

```bash
MQTT_BROKER_URL=your_mqtt_broker_url
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MQTT_PORT=1883
```

---

## 📋 How to Add in Railway

1. Go to Railway Dashboard
2. Click on your service
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Enter **Key** and **Value**
6. Click **"Add"**
7. Railway will auto-redeploy

---

## ✅ Minimum Setup (Just to Get Started)

### Backend Service:
- ✅ `DATABASE_URL` (required)

### MQTT Worker Service:
- ✅ `DATABASE_URL` (required)

**That's it!** The backend will start with just `DATABASE_URL`. Add other variables as needed for specific features.

---

## 🎯 Quick Copy for Backend

Copy this into Railway Backend Service → Variables:

```
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

---

## 🎯 Quick Copy for MQTT Worker

Copy this into Railway MQTT Worker Service → Variables:

```
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

---

## ⚠️ Important Notes

1. **No quotes needed** - Railway handles values as-is
2. **No spaces** around the `=` sign
3. **Copy exactly** - especially the database URL
4. **Add one at a time** - Railway will redeploy after each addition
5. **Check logs** after adding variables to verify everything works

---

For detailed deployment instructions, see: **RAILWAY_DEPLOYMENT_GUIDE.md**

