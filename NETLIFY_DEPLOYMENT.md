# 🚀 Netlify Deployment Guide

## Quick Deploy

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Sign in or create an account

2. **Add New Site**
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect to **GitHub** (or GitLab/Bitbucket)
   - Select your repository: `SIH-krishi-mithr`

3. **Configure Build Settings**
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (or leave default - Netlify will auto-detect Next.js)
   - **Base directory:** (leave empty)

4. **Add Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Add these variables:

```bash
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority
JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
NEXT_PUBLIC_API_URL=https://sih-krishi-mithr.onrender.com
```

5. **Deploy**
   - Click **"Deploy site"**
   - Wait for build to complete
   - Your site will be live at: `https://your-site-name.netlify.app`

---

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize Netlify**
```bash
netlify init
```
   - Follow prompts to link your site

4. **Set Environment Variables**
```bash
netlify env:set DATABASE_URL "mongodb+srv://..."
netlify env:set JWT_SECRET "7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6"
netlify env:set NEXT_PUBLIC_API_URL "https://sih-krishi-mithr.onrender.com"
```

5. **Deploy**
```bash
netlify deploy --prod
```

---

## Required Environment Variables

Add these in **Netlify Dashboard** → **Site settings** → **Environment variables**:

### Required:
- `DATABASE_URL` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT secret key (use the one provided or generate your own)

### Optional:
- `NEXT_PUBLIC_API_URL` - Backend API URL (if using external backend)
- `OPENWEATHER_API_KEY` - Weather API key (optional)

---

## Build Configuration

The `netlify.toml` file is already configured with:
- Build command: `npm run build`
- Next.js plugin: `@netlify/plugin-nextjs` (auto-installed)
- Node version: 18

---

## Post-Deployment

1. **Verify Deployment**
   - Check build logs for any errors
   - Test signup/login functionality
   - Verify API routes are working

2. **Custom Domain (Optional)**
   - Go to **Domain settings**
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Enable Continuous Deployment**
   - Already enabled by default when connected to Git
   - Every push to `main` branch will trigger a new deployment

---

## Troubleshooting

### Build Fails

1. **Check Build Logs**
   - Go to **Deploys** → Click on failed deployment → **View build log**
   - Look for error messages

2. **Common Issues:**
   - **Missing environment variables** - Make sure all required vars are set
   - **Prisma errors** - Run `npx prisma generate` locally and commit changes
   - **Build timeout** - Netlify has a 15-minute build limit (should be enough)

### API Routes Not Working

1. **Check Environment Variables**
   - Verify `DATABASE_URL` and `JWT_SECRET` are set
   - Make sure they're set for **Production** environment

2. **Check Function Logs**
   - Go to **Functions** tab in Netlify dashboard
   - Check for any runtime errors

### Database Connection Issues

1. **MongoDB Atlas Network Access**
   - Add Netlify's IP ranges or set to "Allow access from anywhere"
   - Go to MongoDB Atlas → Network Access → Add IP Address → `0.0.0.0/0`

---

## Notes

- Netlify automatically detects Next.js and uses the `@netlify/plugin-nextjs` plugin
- API routes work automatically as Netlify Functions
- The `netlify.toml` file is already configured
- Environment variables are encrypted and secure
- Free tier includes 100GB bandwidth and 300 build minutes/month

---

## Quick Reference

**Netlify Dashboard:** https://app.netlify.com  
**Documentation:** https://docs.netlify.com  
**Next.js on Netlify:** https://docs.netlify.com/integrations/frameworks/nextjs/

