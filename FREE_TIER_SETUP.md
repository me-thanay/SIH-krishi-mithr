# 🆓 Free Tier Setup Guide

## ✅ Everything is FREE!

This setup uses **100% free services**:
- ✅ **Render** - Free tier for background worker
- ✅ **MongoDB Atlas** - Free M0 cluster (512MB)
- ✅ **Vercel** - Free tier for Next.js frontend
- ✅ **HiveMQ** - Free public MQTT broker

## 🎯 Free Tier Optimizations

The MQTT service has been optimized for Render's free tier:

### 1. Keep-Alive Mechanism
- ✅ Periodic heartbeat every 5 minutes
- ✅ Prevents service from being marked as idle
- ✅ Keeps MQTT connection active

### 2. Connection Management
- ✅ MQTT keepalive set to 60 seconds
- ✅ Automatic reconnection on disconnect
- ✅ Efficient resource usage

## 📊 Free Tier Limits

### Render Free Tier
- **750 instance hours/month** (shared across all services)
- Services stay active with keep-alive mechanism
- If you exceed 750 hours, service pauses until next month

### MongoDB Atlas Free Tier
- **512 MB storage**
- **100 operations/second**
- Perfect for sensor data collection

### Vercel Free Tier
- Unlimited deployments
- Perfect for Next.js frontend

## 🚀 Deployment Steps (100% Free)

### Step 1: Deploy on Render (Free)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect `render.yaml`
5. **Select FREE plan** for the worker service
6. Add `DATABASE_URL` environment variable
7. Click **"Apply"**

### Step 2: Verify It's Free

In Render dashboard:
- Check that `krishi-mithr-mqtt-worker` shows **"Free"** plan
- Service will start automatically

### Step 3: Monitor Usage

- Go to Render Dashboard → **Usage** tab
- Track your instance hours
- You get 750 hours/month (enough for 24/7 for ~25 days)

## 💡 Tips to Stay Within Free Tier

1. **Keep-Alive Works**: The service stays active as long as it receives MQTT data
2. **Monitor Usage**: Check Render dashboard monthly
3. **Optimize**: If you have multiple services, share the 750 hours

## ⚠️ What Happens If You Exceed Limits?

### Render (750 hours/month)
- Service pauses until next month
- No data loss (just paused)
- Upgrade to $7/month for unlimited hours

### MongoDB Atlas (512MB)
- Database becomes read-only
- Upgrade to paid plan for more storage

## ✅ Free Tier Checklist

- [ ] Render account created (free)
- [ ] MongoDB Atlas M0 cluster (free)
- [ ] Vercel account (free)
- [ ] Worker deployed on Render (free plan)
- [ ] `DATABASE_URL` environment variable set
- [ ] Service running and receiving MQTT data
- [ ] Monitoring usage in Render dashboard

## 🎉 You're All Set!

Everything runs on **100% free tier**:
- ✅ MQTT worker on Render (free)
- ✅ MongoDB Atlas (free)
- ✅ Next.js frontend on Vercel (free)
- ✅ MQTT broker (HiveMQ public - free)

**Total Cost: $0/month** 🎊

---

## 📞 Need Help?

If you exceed free tier limits:
1. Monitor usage in Render dashboard
2. Consider upgrading to $7/month for unlimited hours
3. Or optimize by reducing other services

For most use cases, **free tier is more than enough!** ✅

