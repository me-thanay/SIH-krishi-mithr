# Fix 500 Errors on Login/Signup in Vercel

## Current Status
- ✅ Render backend working: `https://sih-krishi-mithr.onrender.com`
- ❌ Vercel login/signup: 500 errors (P2010 Prisma error)

## Root Cause
The Vercel deployment can't connect to MongoDB Atlas. This is a **DATABASE_URL** or **MongoDB Atlas Network Access** issue.

---

## Step 1: Verify DATABASE_URL in Vercel

### Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select project: `krishi-mithr`
3. Go to: **Settings** → **Environment Variables**

### Check DATABASE_URL
It should be **exactly** this (copy-paste, no spaces):

```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### Common Mistakes:
- ❌ Missing database name: `...mongodb.net/?appName=...` (WRONG)
- ✅ Correct: `...mongodb.net/krishi-mithr?appName=...` (CORRECT)
- ❌ Extra spaces or line breaks
- ❌ Wrong password or username
- ❌ Missing `?appName=Cluster0` at the end

### If DATABASE_URL is Wrong:
1. Click **Edit** on `DATABASE_URL`
2. Delete the old value
3. Paste the correct value above
4. Make sure it's enabled for: **Production**, **Preview**, **Development**
5. Click **Save**

---

## Step 2: Check MongoDB Atlas Network Access

### Go to MongoDB Atlas
1. Visit: https://cloud.mongodb.com
2. Login to your account
3. Select your cluster: `Cluster0`

### Network Access
1. Go to **Network Access** (left sidebar)
2. Check if `0.0.0.0/0` is in the list (allows all IPs)
3. If NOT:
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - Click **Confirm**
   - **Wait 2-3 minutes** for changes to propagate

### Why This Matters
Vercel uses dynamic IPs. Without `0.0.0.0/0`, Vercel can't connect to MongoDB.

---

## Step 3: Verify Database User

### Database Access
1. Go to **Database Access** (left sidebar)
2. Find user: `trythanay_db_user`
3. Verify it has:
   - **Atlas admin** OR
   - **Read and write to any database**

---

## Step 4: Redeploy in Vercel

**After fixing DATABASE_URL:**

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional, faster)
5. Click **Redeploy**
6. **Wait 2-3 minutes** for deployment

---

## Step 5: Test After Fix

### Test Login:
```javascript
fetch('https://krishi-mithr.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
})
  .then(async (r) => {
    const data = await r.json()
    console.log('Status:', r.status)
    console.log('Response:', data)
    return data
  })
  .catch(console.error)
```

### Expected Results:

#### ✅ Success (200 or 401):
- **200**: Login successful (if user exists)
- **401**: Invalid credentials (expected for test email)

#### ❌ Still 500:
- Check Vercel Function Logs (see Step 6)

---

## Step 6: Check Vercel Function Logs

If still getting 500 errors:

1. Go to **Deployments** → Latest deployment
2. Click **Functions** tab
3. Click on `/api/auth/login`
4. Check **Logs** tab
5. Look for:
   - `DATABASE_URL` errors
   - `P2010` errors
   - Connection timeout errors
   - Prisma errors

### Common Log Errors:

#### Error: "DATABASE_URL is not set"
- **Fix**: Add DATABASE_URL in Vercel environment variables

#### Error: "P2010" or "Raw query execution error"
- **Fix**: Check DATABASE_URL format (must include database name)
- **Fix**: Check MongoDB Atlas Network Access

#### Error: "Can't reach database server"
- **Fix**: MongoDB Atlas Network Access - allow `0.0.0.0/0`

---

## Complete Checklist

- [ ] DATABASE_URL is set in Vercel (exact format above)
- [ ] DATABASE_URL includes database name: `...mongodb.net/krishi-mithr?...`
- [ ] DATABASE_URL has no spaces or line breaks
- [ ] MongoDB Atlas Network Access allows `0.0.0.0/0`
- [ ] Database user `trythanay_db_user` exists and has permissions
- [ ] Redeployed in Vercel after fixing
- [ ] Waited 2-3 minutes after redeploy
- [ ] Tested login endpoint again

---

## Quick Test Commands

### Test MongoDB Connection (from your local machine):
```bash
# If you have MongoDB tools installed
mongosh "mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0"
```

### Test from Browser Console:
```javascript
// Test if endpoint exists
fetch('https://krishi-mithr.vercel.app/api/auth/login', {
  method: 'OPTIONS'
})
  .then(r => console.log('OPTIONS Status:', r.status))
  .catch(console.error)
```

---

## Most Common Fix

**90% of the time, the issue is:**

1. **DATABASE_URL missing database name**
   - Wrong: `...mongodb.net/?appName=...`
   - Right: `...mongodb.net/krishi-mithr?appName=...`

2. **MongoDB Atlas Network Access**
   - Not allowing `0.0.0.0/0`
   - Solution: Add `0.0.0.0/0` in Network Access

---

## Still Not Working?

If you've checked everything above:

1. **Share the exact error** from Vercel Function Logs
2. **Verify DATABASE_URL** - copy it from Vercel and check it matches exactly
3. **Check MongoDB Atlas** - verify cluster is running and accessible

The improved error handling will now show more specific messages to help identify the exact issue!



















