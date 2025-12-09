# 🔄 Redeploy Netlify Site After Adding Environment Variables

## Why Redeploy?

Environment variables are only available to your site **after a new deployment**. If you added variables but haven't redeployed, they won't be available to your application.

## How to Redeploy

### Option 1: Trigger Manual Redeploy (Recommended)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site

2. **Navigate to Deploys**
   - Click on **"Deploys"** in the left sidebar

3. **Trigger New Deploy**
   - Click **"Trigger deploy"** button (usually at the top right)
   - Select **"Deploy site"**
   - Wait for the build to complete

### Option 2: Push a New Commit

1. Make a small change to any file (or just add a comment)
2. Commit and push:
   ```bash
   git commit --allow-empty -m "Trigger Netlify redeploy"
   git push
   ```
3. Netlify will automatically detect the push and redeploy

## Verify Environment Variables Are Active

After redeploying:

1. **Check Build Logs**
   - Go to **Deploys** → Click on the latest deployment
   - Check the build log for any errors
   - Look for successful build completion

2. **Test the Login**
   - Go to your Netlify site URL
   - Try to login with phone + face photo
   - The 500 error should be resolved

## Troubleshooting

### Still Getting 500 Error After Redeploy?

1. **Check Function Logs**
   - Go to **Functions** tab in Netlify dashboard
   - Check for runtime errors
   - Look for any database connection errors

2. **Verify MongoDB Atlas Access**
   - Make sure MongoDB Atlas allows connections from Netlify IPs
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (or add Netlify's IP ranges)

3. **Check Environment Variable Names**
   - Make sure variable names are exactly:
     - `DATABASE_URL` (not `DATABASE_URI` or `DB_URL`)
     - `JWT_SECRET` (not `JWT_TOKEN` or `SECRET`)
   - Case-sensitive!

4. **Check Variable Values**
   - Make sure `DATABASE_URL` includes the database name: `...mongodb.net/krishi-mithr?...`
   - Make sure `JWT_SECRET` is not empty

## Quick Test

After redeploying, you can test if environment variables are working by checking the build logs. You should NOT see:
- ❌ "DATABASE_URL is not set"
- ❌ "JWT_SECRET is not set or using fallback"

If you see these errors, the variables aren't being picked up. Make sure you:
1. Set them for the correct environment (Production, Deploy previews, etc.)
2. Redeployed after adding them


