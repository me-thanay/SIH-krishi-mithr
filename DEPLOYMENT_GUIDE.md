# 🚀 Deployment Guide - Render & Vercel

This guide outlines all environment variables needed for deploying your Smart AgriTech platform.

## 📋 Environment Variables Overview

### 🔴 **Render (Backend - FastAPI)**

Deploy your FastAPI backend on Render. Add these environment variables in Render Dashboard:

#### **Required Variables:**

```bash
# Database
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority

# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=kissan_verification_token

# Weather API
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Agricultural APIs (Optional - for advanced features)
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here
NASA_POWER_API_KEY=your_nasa_power_api_key_here
OPENLANDMAP_API_KEY=your_openlandmap_api_key_here
ONESOIL_API_KEY=your_onesoil_api_key_here

# Voice & AI APIs
OPENAI_API_KEY=your_openai_api_key_here

# Webhook URL (Update with your Render backend URL)
WEBHOOK_URL=https://your-render-app.onrender.com/api/webhook/whatsapp
```

#### **Render Setup Steps:**

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Add all environment variables** listed above
6. **Deploy!**

---

### 🟢 **Vercel (Frontend - Next.js)**

Deploy your Next.js frontend on Vercel. Add these environment variables in Vercel Dashboard:

#### **Required Variables:**

```bash
# Database (MongoDB Atlas)
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_very_secure_random_jwt_secret_key_here

# Backend API URL (Your Render backend URL)
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com

# Weather API
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Agricultural APIs (Optional - for advanced features)
PLANT_ID_API_KEY=your_plant_id_api_key_here
PLANTNET_API_KEY=your_plantnet_api_key_here

# Voice & AI APIs
OPENAI_API_KEY=your_openai_api_key_here

# Environment (Auto-set by Vercel, but you can override)
NODE_ENV=production
```

#### **Vercel Setup Steps:**

1. **Import your GitHub repository** to Vercel
2. **Framework Preset:** Next.js (auto-detected)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install`
6. **Add all environment variables** listed above
7. **Deploy!**

---

## 🔐 Security Best Practices

### **JWT_SECRET Generation:**

Generate a strong JWT secret using one of these methods:

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 64
```

**Option 3: Online Generator**
Visit: https://generate-secret.vercel.app/64

### **Environment Variable Priority:**

1. **Production values** should be different from development
2. **Never commit** `.env` files to Git (already in `.gitignore`)
3. **Rotate secrets** periodically
4. **Use different JWT_SECRET** for each environment

---

## 🔗 API Endpoints Configuration

### **Backend (Render):**
- Base URL: `https://your-render-app.onrender.com`
- API Docs: `https://your-render-app.onrender.com/docs`
- Health Check: `https://your-render-app.onrender.com/health`

### **Frontend (Vercel):**
- Base URL: `https://your-app.vercel.app`
- Make sure `NEXT_PUBLIC_API_URL` points to your Render backend

---

## 📝 Quick Setup Checklist

### **Render (Backend):**
- [ ] Create Render account
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set build and start commands
- [ ] Add all environment variables
- [ ] Deploy and get backend URL
- [ ] Test API at `/docs` endpoint

### **Vercel (Frontend):**
- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Configure Next.js settings
- [ ] Add all environment variables
- [ ] Set `NEXT_PUBLIC_API_URL` to Render backend URL
- [ ] Deploy and test frontend

---

## 🐛 Troubleshooting

### **Common Issues:**

1. **Database Connection Errors:**
   - Verify `DATABASE_URL` is correct
   - Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Render/Vercel)
   - Ensure database user has proper permissions

2. **CORS Errors:**
   - Verify `NEXT_PUBLIC_API_URL` matches your Render backend URL
   - Check FastAPI CORS settings in `app/main.py`

3. **JWT Authentication Errors:**
   - Ensure `JWT_SECRET` is set and consistent
   - Verify JWT_SECRET is the same in all environments

4. **API Key Errors:**
   - Verify all API keys are correctly set
   - Check API key permissions and quotas

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup Guide](./MONGODB_SETUP.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

## 🔄 Updating Environment Variables

### **Render:**
1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add/Update variables
4. Redeploy service

### **Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add/Update variables
4. Redeploy (automatic or manual)

---

**Note:** After updating environment variables, you may need to trigger a new deployment for changes to take effect.

