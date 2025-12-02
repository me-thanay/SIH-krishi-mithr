# 🚀 Fly.io Setup Guide (100% Free)

## Why Fly.io?

- ✅ **Generous free tier** - 3 shared-cpu VMs
- ✅ **3GB persistent volumes** included
- ✅ **160GB outbound data transfer** per month
- ✅ **No payment info required** for free tier
- ✅ **Perfect for background workers**

## Step-by-Step Setup

### Step 1: Install Fly CLI

#### Windows (PowerShell):
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

#### Or Download:
1. Go to [fly.io/docs/getting-started/installing-flyctl/](https://fly.io/docs/getting-started/installing-flyctl/)
2. Download Windows installer
3. Run installer

### Step 2: Sign Up

1. Open terminal/PowerShell
2. Run:
   ```bash
   fly auth signup
   ```
3. Follow prompts to create account (free)

### Step 3: Login

```bash
fly auth login
```

### Step 4: Initialize App

Navigate to your project directory:
```bash
cd path/to/SIH-krishi-mithr-main
```

Initialize Fly.io app:
```bash
fly launch --no-deploy
```

**When prompted:**
- App name: `krishi-mithr-mqtt` (or any name you like)
- Region: Choose closest to you (e.g., `iad` for US East)
- PostgreSQL: **No** (we use MongoDB)
- Redis: **No**

### Step 5: Configure Environment Variable

Set MongoDB connection:
```bash
fly secrets set DATABASE_URL="mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0"
```

### Step 6: Deploy

Deploy your app:
```bash
fly deploy
```

### Step 7: Verify

Check logs:
```bash
fly logs
```

You should see:
```
✅ Connected to MongoDB Atlas
✅ Connected to MQTT broker
📡 Subscribed to topic: krishimithr/sensor/data
⏳ Waiting for sensor data...
💓 Keep-alive enabled (prevents free tier spin-down)
```

## ✅ That's It!

Your MQTT service is now running on Fly.io for **FREE**!

## 💰 Free Tier Limits

- ✅ **3 shared-cpu VMs** (1.5GB RAM total)
- ✅ **3GB persistent volumes**
- ✅ **160GB outbound data transfer/month**
- ✅ **Unlimited inbound data**
- ✅ **Perfect for MQTT background workers**

## 🎯 Useful Commands

### View Logs:
```bash
fly logs
```

### Check Status:
```bash
fly status
```

### View App Info:
```bash
fly info
```

### Restart App:
```bash
fly apps restart krishi-mithr-mqtt
```

### Scale App:
```bash
# Free tier allows 1 VM
fly scale count 1
```

## 🆘 Troubleshooting

### App Won't Start?

1. **Check logs:**
   ```bash
   fly logs
   ```

2. **Verify secrets:**
   ```bash
   fly secrets list
   ```

3. **Check app status:**
   ```bash
   fly status
   ```

### Connection Issues?

- Verify `DATABASE_URL` is set correctly
- Check MongoDB Atlas Network Access (should allow `0.0.0.0/0`)
- Check MQTT broker is accessible

### Build Fails?

- Ensure `requirements_mqtt.txt` exists
- Check Python version compatibility
- Review build logs: `fly logs`

## 📋 Quick Reference

| Command | Description |
|---------|-------------|
| `fly launch` | Initialize new app |
| `fly deploy` | Deploy app |
| `fly logs` | View logs |
| `fly status` | Check app status |
| `fly secrets set KEY=value` | Set environment variable |
| `fly secrets list` | List all secrets |
| `fly apps restart <app>` | Restart app |

## 🌍 Available Regions

Choose closest region for better performance:

- `iad` - Washington, D.C., USA
- `sjc` - San Jose, California, USA
- `lhr` - London, UK
- `cdg` - Paris, France
- `nrt` - Tokyo, Japan
- `syd` - Sydney, Australia

View all: `fly regions list`

## 🎉 Summary

1. ✅ Install Fly CLI
2. ✅ Sign up: `fly auth signup`
3. ✅ Initialize: `fly launch --no-deploy`
4. ✅ Set secret: `fly secrets set DATABASE_URL=...`
5. ✅ Deploy: `fly deploy`
6. ✅ Monitor: `fly logs`

**Total setup time: 10 minutes!** ⚡

---

## 💡 Pro Tips

- **Free tier is generous** - enough for production use
- **Auto-scales** - handles traffic spikes
- **Global edge network** - fast worldwide
- **Great documentation** - check fly.io/docs

---

**Your MQTT service is now running globally on Fly.io!** 🚀

