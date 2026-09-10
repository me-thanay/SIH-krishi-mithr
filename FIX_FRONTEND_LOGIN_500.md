# 🔴 Fix Frontend Login 500 Error

## The Problem

Your frontend is calling `/api/auth/login` which is a **Next.js API route** that runs on your **frontend deployment** (Netlify/Vercel), NOT on Railway.

The 500 error means your frontend deployment is missing required environment variables.

---

## ✅ Solution: Set Environment Variables in Frontend

### For Netlify:

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site

2. **Go to Environment Variables**
   - **Site settings** → **Environment variables**

3. **Add These Variables:**

   ```bash
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```

   ```bash
   JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
   ```

4. **Set for All Environments**
   - When adding each variable, select:
     - ✅ **Production**
     - ✅ **Deploy previews**
     - ✅ **Branch deploys**

5. **Redeploy**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - Wait 2-5 minutes

---

### For Vercel:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Go to Environment Variables**
   - **Settings** → **Environment Variables**

3. **Add These Variables:**

   ```bash
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```

   ```bash
   JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
   ```

4. **Set for All Environments**
   - Select: **Production**, **Preview**, **Development**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**

---

## 🔍 Verify Variables Are Set

After redeploying, check:

1. **Build Logs**
   - Should see: `✔ Generated Prisma Client`
   - No errors about missing environment variables

2. **Function Logs** (Netlify)
   - Go to **Functions** tab
   - Check logs for `/api/auth/login`
   - Should not see: `DATABASE_URL is not set` or `JWT_SECRET is not set`

3. **Test Login**
   - Try logging in from your frontend
   - Should work without 500 error

---

## 🐛 Still Getting 500?

### Check MongoDB Atlas Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Network Access** → **Add IP Address**
3. Add `0.0.0.0/0` (Allow from anywhere) for testing
4. Or add your deployment platform's IP ranges

### Check Function Logs

**Netlify:**
- **Functions** tab → **View logs** → Look for error messages

**Vercel:**
- **Deployments** → Click deployment → **Function Logs** tab

Common errors:
- `DATABASE_URL is not set` → Add the variable and redeploy
- `JWT_SECRET is not set` → Add the variable and redeploy
- `Can't reach database server` → Check MongoDB Atlas Network Access
- `P2010` → Prisma client needs regeneration (should happen automatically on build)

---

## 📝 Important Notes

1. **Frontend API Routes Run on Frontend Deployment**
   - `/api/auth/login` runs on Netlify/Vercel, NOT Railway
   - Railway is only for your FastAPI backend (different endpoints)

2. **Environment Variables Must Be Set in Frontend**
   - `DATABASE_URL` and `JWT_SECRET` must be set in Netlify/Vercel
   - These are used by Next.js API routes

3. **Redeploy After Setting Variables**
   - Environment variables only take effect after a new deployment
   - Always redeploy after adding/updating variables

---

## ✅ Quick Checklist

- [ ] `DATABASE_URL` is set in frontend deployment (Netlify/Vercel)
- [ ] `JWT_SECRET` is set in frontend deployment (Netlify/Vercel)
- [ ] Both variables enabled for all environments (Production, Preview, Development)
- [ ] Frontend has been redeployed after setting variables
- [ ] MongoDB Atlas Network Access allows connections (0.0.0.0/0)
- [ ] Checked function logs for specific error messages

---

**After completing these steps, your login should work!**

