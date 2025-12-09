# 🔴 Troubleshooting 500 Error on Login

## Current Status
The `/api/auth/login` endpoint is returning a 500 error. This guide will help you diagnose and fix it.

## Step 1: Check Vercel Environment Variables

### Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Verify These 3 Variables Exist:

#### ✅ 1. DATABASE_URL
```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

#### ✅ 2. JWT_SECRET
```
14ecab3bd43e8b60498500109968a08a266813bcbc8b7a80a66556150a9eeb17
```

#### ✅ 3. NEXT_PUBLIC_API_URL
```
https://sih-krishi-mithr.onrender.com
```
**Important:** No trailing slash!

### Check Environment Scope
Make sure each variable is enabled for:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## Step 2: Check Vercel Build Logs

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Build Logs**
4. Look for errors related to:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `Prisma`
   - `MongoDB`

---

## Step 3: Test the Endpoint

After redeploying, test in browser console:

```javascript
fetch('https://your-vercel-app.vercel.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  })
})
  .then(async (r) => {
    const data = await r.json()
    console.log('Status:', r.status)
    console.log('Response:', data)
    return data
  })
  .catch(console.error)
```

### Expected Responses:

#### ✅ Success (200):
```json
{
  "success": true,
  "user": {...},
  "token": "...",
  "message": "Login successful"
}
```

#### ❌ Missing DATABASE_URL (500):
```json
{
  "error": "Server configuration error: DATABASE_URL missing"
}
```

#### ❌ Missing JWT_SECRET (500):
```json
{
  "error": "Server configuration error: JWT_SECRET missing"
}
```

#### ❌ Database Connection Error (500):
```json
{
  "error": "Database configuration error",
  "message": "Database connection is not properly configured..."
}
```

---

## Step 4: Common Issues & Solutions

### Issue 1: Environment Variables Not Set
**Solution:** Add all 3 variables in Vercel (see Step 1)

### Issue 2: Variables Set But Not Redeployed
**Solution:** 
1. Go to Deployments
2. Click **⋯** on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

### Issue 3: MongoDB Atlas Connection Blocked
**Solution:**
1. Go to MongoDB Atlas Dashboard
2. Go to **Network Access**
3. Make sure `0.0.0.0/0` is allowed (or add Vercel IPs)
4. Wait 2-3 minutes for changes to propagate

### Issue 4: Prisma Client Not Generated
**Solution:**
- Check `package.json` build script includes `prisma generate`
- It should be: `"build": "prisma generate && next build"`

### Issue 5: Wrong Database URL Format
**Solution:**
- Make sure the URL includes the database name: `...mongodb.net/krishi-mithr?...`
- Check for special characters in password (may need URL encoding)

---

## Step 5: Check Vercel Function Logs

1. Go to **Deployments** → Latest deployment
2. Click **Functions** tab
3. Click on `/api/auth/login`
4. Check **Logs** for runtime errors

---

## Quick Checklist

- [ ] All 3 environment variables added to Vercel
- [ ] Variables enabled for Production, Preview, Development
- [ ] Redeployed after adding variables
- [ ] Checked build logs for errors
- [ ] Checked function logs for runtime errors
- [ ] MongoDB Atlas Network Access allows Vercel IPs
- [ ] Tested login endpoint with console command

---

## Still Not Working?

If you've checked everything above and it's still not working:

1. **Check the exact error message** from the test command above
2. **Share the error message** - it will tell us exactly what's wrong
3. **Check Vercel Function Logs** for the specific error

The improved error handling will now show specific error messages that will help identify the exact issue!



















