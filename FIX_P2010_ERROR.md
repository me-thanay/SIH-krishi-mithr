# Fix P2010 Prisma Error

## Error Details
```
Error Code: P2010
Message: Invalid `prisma.user.findUnique()` invocation
```

## What P2010 Means
P2010 is a Prisma error that occurs when:
1. **Prisma Client not generated** - The client needs to be regenerated
2. **MongoDB connection issue** - Can't connect to MongoDB Atlas
3. **Schema mismatch** - Database schema doesn't match Prisma schema
4. **Invalid DATABASE_URL** - Connection string is malformed

## Solutions

### Solution 1: Verify DATABASE_URL in Vercel

1. Go to **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Check `DATABASE_URL` is set to:
   ```
   mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
3. Make sure there are **no extra spaces** or **line breaks**
4. Make sure it's enabled for **Production**, **Preview**, and **Development**

### Solution 2: Verify Prisma Client is Generated

The build script should include `prisma generate`. Check `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

**In Vercel:**
1. Go to **Settings** → **General**
2. Check **Build Command** is: `npm run build` (or `yarn build`)
3. This should run `prisma generate` automatically

### Solution 3: Check MongoDB Atlas Connection

1. **Network Access:**
   - Go to MongoDB Atlas Dashboard
   - **Network Access** → Make sure `0.0.0.0/0` is allowed (or add Vercel IPs)

2. **Database User:**
   - Go to **Database Access**
   - Verify user `trythanay_db_user` exists and has proper permissions

3. **Connection String:**
   - Make sure the connection string includes the database name: `...mongodb.net/krishi-mithr?...`

### Solution 4: Push Schema to Database

If the database schema is out of sync:

**Locally:**
```bash
npx prisma db push
```

**Or in Vercel Build Command (if needed):**
Add to build script:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```

### Solution 5: Regenerate Prisma Client

**Locally:**
```bash
npx prisma generate
```

**In Vercel:**
- The build command should handle this automatically
- If not, add `prisma generate` to the build command

## Quick Checklist

- [ ] DATABASE_URL is set correctly in Vercel (no spaces, no line breaks)
- [ ] DATABASE_URL includes database name: `...mongodb.net/krishi-mithr?...`
- [ ] MongoDB Atlas Network Access allows Vercel IPs (0.0.0.0/0)
- [ ] Build command includes `prisma generate`
- [ ] Schema is pushed to database (`prisma db push`)
- [ ] Redeployed after making changes

## Test After Fix

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

## Most Likely Cause

**90% of P2010 errors are caused by:**
1. **Incorrect DATABASE_URL** - Missing database name or wrong format
2. **MongoDB Atlas Network Access** - Vercel IPs not allowed
3. **Prisma Client not generated** - Build process issue

## Next Steps

1. **Double-check DATABASE_URL** in Vercel (most common issue)
2. **Verify MongoDB Atlas Network Access** allows all IPs
3. **Redeploy** in Vercel after fixing
4. **Test again** with the command above



















