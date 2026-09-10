# ⚡ Netlify + Railway Quick Reference

## 🚂 Railway Backend (5 Minutes)

1. **Sign up:** [railway.app](https://railway.app) → GitHub
2. **New Project** → Deploy from GitHub → Select repo
3. **Variables** tab → Add:
   ```bash
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
4. **Settings** → **Networking** → Copy URL: `https://your-backend.up.railway.app`
5. Test: `https://your-backend.up.railway.app/health`

---

## 🌐 Netlify Frontend (5 Minutes)

1. **Sign up:** [netlify.com](https://netlify.com) → GitHub
2. **Add new site** → Import from GitHub → Select repo
3. **Site settings** → **Environment variables** → Add:

   ```bash
   DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```

   ```bash
   JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
   ```

   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   ```
   ⚠️ Replace with your actual Railway URL!

4. Enable for: **Production**, **Deploy previews**, **Branch deploys**
5. **Deploys** → **Trigger deploy**
6. Wait 2-5 minutes

---

## ✅ Verify

- [ ] Railway backend: `/health` returns `{"status": "healthy"}`
- [ ] Netlify frontend: Site loads
- [ ] Login works (no 500 errors)
- [ ] MongoDB Atlas: Network Access allows `0.0.0.0/0`

---

## 🐛 Common Issues

**Login 500 Error:**
- ✅ Set `DATABASE_URL` and `JWT_SECRET` in Netlify
- ✅ Redeploy Netlify after setting variables

**CORS Errors:**
- ✅ Set `NEXT_PUBLIC_API_URL` in Netlify to Railway URL
- ✅ Check Railway backend is running

**Backend Won't Start:**
- ✅ Check Railway logs for errors
- ✅ Verify `DATABASE_URL` is correct

---

**Full guide:** See `NETLIFY_RAILWAY_SETUP.md`

