# 🔑 Environment Variables Quick Reference

## 🟢 VERCEL (Frontend - Next.js)

Copy and paste these into Vercel Dashboard → Settings → Environment Variables:

```bash
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority
JWT_SECRET=generate_a_strong_random_64_char_string_here
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
OPENWEATHER_API_KEY=your_openweather_api_key_here
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** Replace `your-render-app.onrender.com` with your actual Render backend URL after deployment.

---

## 🔴 RENDER (Backend - FastAPI)

Copy and paste these into Render Dashboard → Your Service → Environment:

```bash
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=kissan_verification_token
OPENWEATHER_API_KEY=your_openweather_api_key_here
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
NASA_POWER_API_KEY=your_nasa_power_api_key_here
OPENLANDMAP_API_KEY=your_openlandmap_api_key_here
ONESOIL_API_KEY=your_onesoil_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
WEBHOOK_URL=https://your-render-app.onrender.com/api/webhook/whatsapp
```

**Note:** Update `WEBHOOK_URL` after your Render service is deployed and you have the actual URL.

---

## 🔐 Generate JWT_SECRET

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use OpenSSL:
```bash
openssl rand -hex 64
```

---

## ✅ Required vs Optional

### **Required for Basic Functionality:**
- `DATABASE_URL` - MongoDB Atlas connection
- `JWT_SECRET` - For authentication (Vercel only)
- `NEXT_PUBLIC_API_URL` - Backend URL (Vercel only)

### **Optional (for enhanced features):**
- `OPENWEATHER_API_KEY` - Weather data
- `PLANT_ID_API_KEY` - Plant/pest detection
- `PLANTNET_API_KEY` - Plant identification
- `OPENAI_API_KEY` - Voice assistant features
- `NASA_POWER_API_KEY` - Climate data
- `OPENLANDMAP_API_KEY` - Soil data
- `ONESOIL_API_KEY` - Soil analysis
- `WHATSAPP_*` - WhatsApp bot features

---

## 🚨 Security Reminders

1. **Never commit** `.env` files to Git
2. **Use different secrets** for production vs development
3. **Rotate secrets** periodically
4. **Keep API keys secure** and don't share them publicly

