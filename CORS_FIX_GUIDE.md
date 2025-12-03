# 🔧 CORS Fix Guide - Step by Step

## Current Issue

- ❌ CORS errors: No 'Access-Control-Allow-Origin' header
- ❌ 404 errors: Endpoint not found
- ❌ Backend might not be deployed with latest code

## ✅ Solution Steps

### Step 1: Verify Backend is Running

1. Open in browser: `https://sih-krishi-mithr-api.onrender.com/health`
2. Should see: `{"status": "healthy", "message": "All services operational"}`
3. If you get an error, the backend is not running!

### Step 2: Redeploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find service: `sih-krishi-mithr-api`
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait 2-3 minutes
5. Check logs to ensure deployment succeeded

### Step 3: Verify Deployment

After deployment, test these URLs:

1. **Root endpoint:**
   ```
   https://sih-krishi-mithr-api.onrender.com/
   ```

2. **Health check:**
   ```
   https://sih-krishi-mithr-api.onrender.com/health
   ```

3. **CORS test:**
   ```
   https://sih-krishi-mithr-api.onrender.com/api/test-cors
   ```

4. **Market prices:**
   ```
   https://sih-krishi-mithr-api.onrender.com/api/market-prices?location=Telangana
   ```

### Step 4: Test CORS from Browser

After redeployment, open your frontend and run:

```javascript
// Test 1: Health check
fetch('https://sih-krishi-mithr-api.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log('✅ Health:', d))
  .catch(e => console.error('❌ Error:', e))

// Test 2: CORS test
fetch('https://sih-krishi-mithr-api.onrender.com/api/test-cors')
  .then(r => r.json())
  .then(d => console.log('✅ CORS Test:', d))
  .catch(e => console.error('❌ Error:', e))

// Test 3: Market prices
fetch('https://sih-krishi-mithr-api.onrender.com/api/market-prices?location=Telangana')
  .then(r => r.json())
  .then(d => console.log('✅ Market Prices:', d))
  .catch(e => console.error('❌ Error:', e))
```

## 🔍 Troubleshooting

### If you still get 404:

1. **Check Render logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for errors during startup
   - Check if the app started successfully

2. **Verify build succeeded:**
   - Check if `pip install -r requirements.txt` completed
   - Check if there are any import errors

3. **Check service status:**
   - Render Dashboard → Your Service → Status
   - Should show "Live" (green)

### If you still get CORS errors:

1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Check response headers:**
   - Open browser DevTools → Network tab
   - Make a request to the API
   - Check Response Headers
   - Look for `Access-Control-Allow-Origin` header

3. **Verify middleware is loaded:**
   - Check Render logs for any middleware errors
   - Ensure FastAPI started without errors

## 📝 Current CORS Configuration

The backend now uses FastAPI's built-in `CORSMiddleware` with:
- `allow_origins=["*"]` - Allows all origins
- `allow_methods=["*"]` - Allows all HTTP methods
- `allow_headers=["*"]` - Allows all headers

This should work for all frontend domains.

## 🚀 Quick Fix Checklist

- [ ] Backend is deployed on Render
- [ ] Latest code is pushed to GitHub
- [ ] Render service shows "Live" status
- [ ] `/health` endpoint returns success
- [ ] `/api/test-cors` endpoint returns success
- [ ] CORS headers appear in browser DevTools
- [ ] Frontend can fetch data without errors

## 💡 Alternative: Use Next.js API Routes as Proxy

If CORS continues to be an issue, you can proxy requests through Next.js API routes (server-side, no CORS needed).

Let me know if you want me to set this up!

