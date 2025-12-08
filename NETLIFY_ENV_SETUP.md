# 🔑 Netlify Environment Variables Setup

## Required Environment Variables

Your `/api/auth/login` endpoint is returning 500 because these environment variables are missing in Netlify.

### 1. Go to Netlify Dashboard
- Visit: https://app.netlify.com
- Select your site: `SIH-krishi-mithr`

### 2. Navigate to Environment Variables
- Go to **Site settings** → **Environment variables**
- Click **Add a variable**

### 3. Add These Variables

#### Required for Authentication:

```bash
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority
```

```bash
JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
```

#### Optional (if using external backend):

```bash
NEXT_PUBLIC_API_URL=https://sih-krishi-mithr.onrender.com
```

### 4. Set for All Environments
- When adding each variable, make sure to select:
  - ✅ **Production**
  - ✅ **Deploy previews**
  - ✅ **Branch deploys**

### 5. Redeploy
- After adding all variables, go to **Deploys** tab
- Click **Trigger deploy** → **Deploy site**
- Or push a new commit to trigger automatic redeploy

---

## Verify Variables Are Set

After redeploying, check the build logs:
1. Go to **Deploys** → Click on the latest deployment
2. Check **Build log** for any errors
3. The build should complete successfully

---

## Test After Deployment

1. Go to your Netlify site URL
2. Try to login with phone + face photo
3. The 500 error should be resolved

---

## Generate Your Own JWT_SECRET (Optional)

If you want to generate a new JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use the one provided above.

---

## Troubleshooting

### Still Getting 500 Error?

1. **Check Build Logs**
   - Make sure environment variables are set correctly
   - Check for typos in variable names

2. **Check MongoDB Atlas**
   - Make sure your IP is allowed (or set to "Allow access from anywhere")
   - Verify `DATABASE_URL` is correct

3. **Check Netlify Functions Logs**
   - Go to **Functions** tab in Netlify dashboard
   - Check for runtime errors

4. **Verify Variables Are Applied**
   - Environment variables are only available at build/runtime
   - Make sure you redeployed after adding them

---

## Quick Checklist

- [ ] `DATABASE_URL` is set in Netlify
- [ ] `JWT_SECRET` is set in Netlify
- [ ] Variables are set for Production environment
- [ ] Site has been redeployed after adding variables
- [ ] MongoDB Atlas allows connections from Netlify IPs (or all IPs)

