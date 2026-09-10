# 💻 Run MQTT Service Locally (100% Free)

## Why Run Locally?

- ✅ **100% Free** - No cloud costs
- ✅ **Full Control** - Complete access to logs and debugging
- ✅ **Easy Testing** - Quick iterations and testing
- ✅ **No Setup Complexity** - Just run the script
- ⚠️ **Requires** - Your computer to be on 24/7

## Quick Start

### Step 1: Install Python Dependencies

```bash
pip install -r requirements_mqtt.txt
```

Or install individually:
```bash
pip install paho-mqtt pymongo python-dotenv
```

### Step 2: Set Environment Variable

#### Option A: Create `.env` file

Create a `.env` file in the project root:

```env
DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

#### Option B: Set in Terminal (Windows PowerShell)

```powershell
$env:DATABASE_URL="mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0"
```

#### Option C: Set in Terminal (Windows CMD)

```cmd
set DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
```

### Step 3: Run the Service

```bash
python mqtt_to_mongodb_krishimithr.py
```

### Step 4: Verify

You should see:
```
✅ Connected to MongoDB Atlas
✅ Connected to MQTT broker
📡 Subscribed to topic: krishimithr/sensor/data
⏳ Waiting for sensor data...
💓 Keep-alive enabled (prevents free tier spin-down)
```

## 🚀 Running in Background

### Windows: Run as Background Service

#### Option 1: Using Task Scheduler (Recommended)

1. **Open Task Scheduler** (search in Windows)
2. **Create Basic Task**
3. **Name**: `KRISHI MITHR MQTT Service`
4. **Trigger**: "When I log on" or "At startup"
5. **Action**: "Start a program"
6. **Program**: `python`
7. **Arguments**: `C:\path\to\mqtt_to_mongodb_krishimithr.py`
8. **Start in**: `C:\path\to\project\directory`
9. **Check**: "Run whether user is logged on or not"
10. **Finish**

#### Option 2: Using PowerShell (Background Job)

```powershell
Start-Process python -ArgumentList "mqtt_to_mongodb_krishimithr.py" -WindowStyle Hidden
```

#### Option 3: Using NSSM (Non-Sucking Service Manager)

1. Download NSSM: [nssm.cc/download](https://nssm.cc/download)
2. Extract and run:
```cmd
nssm install KrishiMithrMQTT
```
3. Configure:
   - **Path**: `C:\Python\python.exe` (or your Python path)
   - **Startup directory**: `C:\path\to\project`
   - **Arguments**: `mqtt_to_mongodb_krishimithr.py`
4. Start service:
```cmd
nssm start KrishiMithrMQTT
```

### Linux/Mac: Using systemd or launchd

#### Linux (systemd)

Create `/etc/systemd/system/krishi-mithr-mqtt.service`:

```ini
[Unit]
Description=KRISHI MITHR MQTT Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/project
Environment="DATABASE_URL=mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0"
ExecStart=/usr/bin/python3 /path/to/mqtt_to_mongodb_krishimithr.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable krishi-mithr-mqtt
sudo systemctl start krishi-mithr-mqtt
sudo systemctl status krishi-mithr-mqtt
```

## 📋 Troubleshooting

### Connection Issues

**MongoDB Connection Failed?**
- Check `DATABASE_URL` is set correctly
- Verify MongoDB Atlas Network Access allows your IP
- Check internet connection

**MQTT Connection Failed?**
- Check internet connection
- Verify `broker.hivemq.com` is accessible
- Check firewall settings

### Service Keeps Stopping?

**On Windows:**
- Check Windows Event Viewer for errors
- Verify Python is in PATH
- Check if antivirus is blocking

**On Linux:**
- Check logs: `journalctl -u krishi-mithr-mqtt -f`
- Verify service status: `systemctl status krishi-mithr-mqtt`

## 🔍 Monitoring

### View Logs in Real-Time

**Windows PowerShell:**
```powershell
Get-Content mqtt_service.log -Wait -Tail 50
```

**Linux/Mac:**
```bash
tail -f mqtt_service.log
```

### Check if Service is Running

**Windows:**
```cmd
tasklist | findstr python
```

**Linux/Mac:**
```bash
ps aux | grep mqtt_to_mongodb
```

## 💡 Tips

1. **Keep Computer Awake**: 
   - Windows: Settings → Power → Never sleep
   - Or use a "Keep Awake" app

2. **Auto-Start on Boot**:
   - Use Task Scheduler (Windows) or systemd (Linux)

3. **Monitor Remotely**:
   - Set up remote desktop/VNC
   - Or use cloud monitoring tools

4. **Backup Plan**:
   - Consider cloud deployment for production
   - Use local for development/testing

## 🎯 Quick Commands Reference

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| **Run** | `python mqtt_to_mongodb_krishimithr.py` | `python3 mqtt_to_mongodb_krishimithr.py` |
| **Stop** | `Ctrl+C` | `Ctrl+C` |
| **Check Running** | `tasklist \| findstr python` | `ps aux \| grep python` |
| **View Logs** | Check console output | `tail -f logs.txt` |

## ✅ Checklist

- [ ] Python installed (3.8+)
- [ ] Dependencies installed: `pip install -r requirements_mqtt.txt`
- [ ] `.env` file created with `DATABASE_URL`
- [ ] Internet connection active
- [ ] MongoDB Atlas Network Access allows your IP
- [ ] Service running: `python mqtt_to_mongodb_krishimithr.py`
- [ ] Logs show successful connection
- [ ] ESP32 is publishing data
- [ ] Data appearing in MongoDB Atlas

## 🎉 You're All Set!

Your MQTT service is now running locally and saving data to MongoDB Atlas!

**Remember**: Keep your computer on and connected to the internet for continuous operation.

