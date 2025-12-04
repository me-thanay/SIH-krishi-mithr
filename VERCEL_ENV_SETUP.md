# Vercel Environment Variables Setup

## Required Environment Variables for Vercel

The `/api/auth/login` and `/api/auth/signup` endpoints require these environment variables in Vercel:

### 1. DATABASE_URL (Required)
```
mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### 2. JWT_SECRET (Required)
```
your-super-secret-jwt-key-change-this-in-production
```
**Important:** Use a strong, random string. You can generate one using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. NEXT_PUBLIC_API_URL (Required for Frontend)
```
https://sih-krishi-mithr.onrender.com
```

## How to Add Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `SIH-krishi-mithr`

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Each Variable**
   - Click **Add New**
   - Enter the **Key** (e.g., `DATABASE_URL`)
   - Enter the **Value** (paste the connection string)
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**

4. **Repeat for All Variables**
   - Add `DATABASE_URL`
   - Add `JWT_SECRET`
   - Add `NEXT_PUBLIC_API_URL`

5. **Redeploy**
   - After adding all variables, go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic redeploy

## Verify Environment Variables

After redeploying, you can verify the variables are set by checking the build logs:
- Go to **Deployments** → Click on a deployment → **Build Logs**
- Look for any errors related to missing environment variables

## Testing After Setup

Once variables are set and redeployed, test the login endpoint:

```javascript
// In browser console
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
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Common Issues

### Issue: Still getting 500 error
- **Solution**: Make sure you redeployed after adding environment variables
- **Solution**: Check Vercel build logs for specific error messages
- **Solution**: Verify DATABASE_URL is correct and MongoDB Atlas allows connections from Vercel IPs

### Issue: Prisma Client errors
- **Solution**: The build should run `prisma generate` automatically (check `package.json` build script)
- **Solution**: If not, add `prisma generate` to your build command in Vercel

### Issue: Database connection timeout
- **Solution**: Check MongoDB Atlas Network Access - allow all IPs (0.0.0.0/0) for testing
- **Solution**: Verify the connection string is correct

## Quick Checklist

- [ ] DATABASE_URL added to Vercel
- [ ] JWT_SECRET added to Vercel
- [ ] NEXT_PUBLIC_API_URL added to Vercel
- [ ] All variables set for Production, Preview, and Development
- [ ] Redeployed the application
- [ ] Checked build logs for errors
- [ ] Tested login endpoint












