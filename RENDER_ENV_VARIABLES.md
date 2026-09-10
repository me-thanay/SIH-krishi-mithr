# 🔐 Render Environment Variables Guide

## Required Environment Variables for Render Backend Deployment

### For FastAPI Backend Service (`sih-krishi-mithr-api`)

#### 1. **DATABASE_URL** (Required)
```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```
- **Purpose**: MongoDB Atlas connection string
- **Required**: Yes
- **Used by**: All database operations, sensor data storage

---

#### 2. **OPENWEATHER_API_KEY** (Optional but Recommended)
```
your_openweather_api_key_here
```
- **Purpose**: Weather API access
- **Required**: No (but weather features won't work without it)
- **Get it from**: https://openweathermap.org/api

---

#### 3. **PLANT_ID_API_KEY** (Optional)
```
your_plant_id_api_key_here
```
- **Purpose**: Plant identification for pest detection
- **Required**: No
- **Get it from**: https://plant.id/

---

#### 4. **OPENAI_API_KEY** (Optional)
```
your_openai_api_key_here
```
- **Purpose**: AI-powered voice chat and advisory
- **Required**: No
- **Get it from**: https://platform.openai.com/

---

#### 5. **WHATSAPP_ACCESS_TOKEN** (Optional)
```
your_whatsapp_access_token_here
```
- **Purpose**: WhatsApp bot integration
- **Required**: No
- **Get it from**: Meta Business API

---

#### 6. **WHATSAPP_PHONE_NUMBER_ID** (Optional)
```
your_phone_number_id_here
```
- **Purpose**: WhatsApp bot phone number
- **Required**: No

---

#### 7. **WHATSAPP_VERIFY_TOKEN** (Optional)
```
kissan_verification_token
```
- **Purpose**: WhatsApp webhook verification
- **Required**: No

---

## How to Add Environment Variables in Render

### Step-by-Step:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Select your service: `sih-krishi-mithr-api`

2. **Navigate to Environment**
   - Click on **"Environment"** tab in the left sidebar

3. **Add Variables**
   - Click **"Add Environment Variable"**
   - Enter **Key** (e.g., `DATABASE_URL`)
   - Enter **Value** (paste the connection string)
   - Click **"Save Changes"**

4. **Redeploy**
   - After adding variables, Render will automatically redeploy
   - Or click **"Manual Deploy"** → **"Deploy latest commit"**

---

## Minimum Required Variables for Basic Functionality

For the backend to start and work with basic features, you **MUST** have:

```bash
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

**That's it!** The backend will start with just `DATABASE_URL`.

---

## Environment Variables for Vercel Frontend

### Required Variables:

#### 1. **DATABASE_URL** (Required)
```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```
- **Purpose**: MongoDB connection for Prisma
- **Required**: Yes

#### 2. **JWT_SECRET** (Required)
```
14ecab3bd43e8b60498500109968a08a266813bcbc8b7a80a66556150a9eeb17
```
- **Purpose**: JWT token signing for authentication
- **Required**: Yes
- **Note**: Use a strong random string in production

#### 3. **NEXT_PUBLIC_API_URL** (Required)
```
https://sih-krishi-mithr-api.onrender.com
```
- **Purpose**: Backend API URL for frontend requests
- **Required**: Yes
- **Important**: No trailing slash!
- **Format**: `https://your-backend-url.onrender.com`

#### 4. **NEXT_PUBLIC_BACKEND_URL** (Optional)
```
https://sih-krishi-mithr-api.onrender.com
```
- **Purpose**: Alternative backend URL (for MQTT control)
- **Required**: No (falls back to `NEXT_PUBLIC_API_URL`)

---

## Quick Setup Checklist

### Render Backend:
- [ ] `DATABASE_URL` is set
- [ ] (Optional) `OPENWEATHER_API_KEY` is set
- [ ] (Optional) Other API keys as needed

### Vercel Frontend:
- [ ] `DATABASE_URL` is set
- [ ] `JWT_SECRET` is set
- [ ] `NEXT_PUBLIC_API_URL` is set (no trailing slash!)
- [ ] (Optional) `NEXT_PUBLIC_BACKEND_URL` is set

---

## Testing Environment Variables

### Test Render Backend:
```bash
# Check if backend is running
curl https://sih-krishi-mithr-api.onrender.com/health

# Should return:
# {"status": "healthy", "message": "All services operational"}
```

### Test Vercel Frontend:
```javascript
// In browser console on your Vercel site
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
// Should show your backend URL
```

---

## Common Issues

### Issue: Backend won't start
**Solution**: Check Render logs for missing `DATABASE_URL`

### Issue: CORS errors
**Solution**: Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel

### Issue: 500 errors on login
**Solution**: Check Vercel has `DATABASE_URL` and `JWT_SECRET` set

### Issue: Can't connect to MongoDB
**Solution**: 
1. Verify `DATABASE_URL` is correct
2. Check MongoDB Atlas Network Access allows Render IPs (or use 0.0.0.0/0)

---

## Security Notes

⚠️ **Important**: 
- Never commit `.env` files to Git
- Use Render/Vercel environment variables for production
- Rotate API keys regularly
- Use strong `JWT_SECRET` in production (not the example one)

---

## Summary

**Minimum Setup:**
- Render: `DATABASE_URL`
- Vercel: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`

**Full Setup:**
- Add all optional API keys as needed for features

