# 🔴 Fix Login 500 Error on Netlify

## Quick Diagnosis

The `/api/auth/login` 500 error is usually caused by:
1. ❌ Missing environment variables (`DATABASE_URL` or `JWT_SECRET`)
2. ❌ Environment variables not active (need redeploy)
3. ❌ MongoDB Atlas connection blocked
4. ❌ Prisma client not generated correctly

---

## Step 1: Check Netlify Function Logs

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site

2. **Check Function Logs**
   - Go to **Functions** tab
   - Click on **View logs** for the latest deployment
   - Look for error messages like:
     - `DATABASE_URL is not set`
     - `JWT_SECRET is not set`
     - `Database connection failed`
     - `Prisma query execution error`

3. **Check Build Logs**
   - Go to **Deploys** tab
   - Click on the latest deployment
   - Check if Prisma generated successfully:
     - Should see: `✔ Generated Prisma Client`

---

## Step 2: Verify Environment Variables

1. **Go to Site Settings**
   - **Site settings** → **Environment variables**

2. **Verify These Variables Exist:**

   ```bash
   DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority
   ```

   ```bash
   JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
   ```

3. **Check Variable Scope**
   - Each variable should be enabled for:
     - ✅ **Production**
     - ✅ **Deploy previews**
     - ✅ **Branch deploys**

4. **Verify Variable Values**
   - `DATABASE_URL` should include the database name: `...mongodb.net/krishi-mithr?...`
   - `JWT_SECRET` should be a long random string (not empty, not "fallback-secret-key")

---

## Step 3: Redeploy After Setting Variables

**IMPORTANT:** Environment variables only take effect after a new deployment!

1. **Trigger Manual Redeploy**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - Wait 2-5 minutes for deployment to complete

2. **Or Push a New Commit**
   ```bash
   git commit --allow-empty -m "Trigger Netlify redeploy"
   git push
   ```

---

## Step 4: Check MongoDB Atlas

1. **Go to MongoDB Atlas Dashboard**
   - Visit: https://cloud.mongodb.com
   - Select your cluster

2. **Check Network Access**
   - Go to **Network Access** (left sidebar)
   - Make sure you have:
     - Either your IP address added
     - OR `0.0.0.0/0` (Allow access from anywhere) for testing

3. **Verify Database Name**
   - Make sure your `DATABASE_URL` includes the correct database name
   - Should be: `...mongodb.net/krishi-mithr?...`
   - NOT: `...mongodb.net/?...` (missing database name)

4. **Check Database User**
   - Go to **Database Access** (left sidebar)
   - Make sure your database user has read/write permissions

---

## Step 5: Test After Redeploy

1. **Wait for Deployment to Complete**
   - Check **Deploys** tab
   - Status should be: **Published**

2. **Test Login**
   - Go to your Netlify site URL
   - Try to login with phone + face photo
   - Check browser console for errors

3. **Check Function Logs Again**
   - If still getting 500, check **Functions** tab for new error messages
   - The logs will show the exact error

---

## Common Error Messages & Fixes

### Error: `DATABASE_URL is not set`
**Fix:** Add `DATABASE_URL` in Netlify environment variables and redeploy

### Error: `JWT_SECRET is not set or using fallback`
**Fix:** Add `JWT_SECRET` in Netlify environment variables and redeploy

### Error: `Database connection failed` or `P1001`
**Fix:** 
- Check MongoDB Atlas Network Access (allow `0.0.0.0/0` for testing)
- Verify `DATABASE_URL` is correct
- Check database user permissions

### Error: `P2010` (Raw query execution error)
**Fix:**
- Regenerate Prisma client: `npx prisma generate`
- Check if database schema matches Prisma schema
- Verify `DATABASE_URL` includes database name

### Error: `Can't reach database server`
**Fix:**
- MongoDB Atlas Network Access issue
- Add `0.0.0.0/0` to allowed IPs
- Or add Netlify's IP ranges

---

## Still Not Working?

1. **Check Function Logs** - Most important step!
   - Go to **Functions** tab → **View logs**
   - Copy the exact error message

2. **Verify Environment Variables Are Active**
   - After setting variables, you MUST redeploy
   - Variables are only available after a new deployment

3. **Test Locally First**
   - Create `.env.local` with your variables
   - Run `npm run dev`
   - Test login locally
   - If it works locally but not on Netlify, it's an environment variable issue

4. **Contact Support**
   - Share the exact error from Function logs
   - Share your environment variable names (not values)

---

## Quick Checklist

- [ ] `DATABASE_URL` is set in Netlify
- [ ] `JWT_SECRET` is set in Netlify
- [ ] Both variables enabled for Production, Preview, Branch deploys
- [ ] Site has been redeployed after setting variables
- [ ] MongoDB Atlas Network Access allows connections
- [ ] `DATABASE_URL` includes database name (`krishi-mithr`)
- [ ] Checked Function logs for specific error messages

