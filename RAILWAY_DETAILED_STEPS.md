# 🚂 Railway Deployment - Detailed Step-by-Step Guide

This guide shows you **exactly where** to find every option in Railway and Vercel dashboards.

---

## Part 1: Deploy FastAPI Backend on Railway

### Step 1: Sign Up / Login to Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** (top right) or **"Login"** if you have an account
3. Sign up with **GitHub** (recommended) - click **"Login with GitHub"**
4. Authorize Railway to access your repositories

---

### Step 2: Create New Project

1. After logging in, you'll see the Railway dashboard
2. Click the **"+ New Project"** button (top left, green button)
3. A dropdown menu will appear
4. Select **"Deploy from GitHub repo"**
5. If this is your first time, you'll need to:
   - Click **"Configure GitHub App"** or **"Install GitHub App"**
   - Select your repositories (or all repositories)
   - Click **"Install"**
6. You'll see a list of your GitHub repositories
7. Find and click on **"SIH-krishi-mithr-main"** (or your repo name)
8. Railway will create a new project and start detecting your codebase

---

### Step 3: Create Backend Service

1. In your Railway project dashboard, you'll see your repository
2. Railway may auto-detect and create a service, OR you need to create one:
   - Look for a **"+ New"** button (usually top right or in the project view)
   - Click **"+ New"**
   - A dropdown will appear
   - Select **"GitHub Repo"** or **"Empty Service"**
   - If "GitHub Repo", select the same repository again
3. A new service will appear in your project

---

### Step 4: Configure Backend Service - Build & Start Commands

1. **Click on the service** you just created (it will have a name like "sih-krishi-mithr" or similar)
2. You'll see the service dashboard with tabs at the top:
   - **Deployments**
   - **Metrics**
   - **Logs**
   - **Settings** ← **Click this tab**
3. In the **Settings** tab, scroll down to find:
   - **Build Command** section
   - **Start Command** section

#### Set Build Command:

1. Find the **"Build Command"** field (or text box)
2. Click in the field
3. Delete any existing text
4. Type or paste:
   ```
   pip install -r requirements.txt
   ```
5. The field should auto-save, or click **"Save"** if there's a save button

#### Set Start Command:

1. Find the **"Start Command"** field (below Build Command)
2. Click in the field
3. Delete any existing text
4. Type or paste:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. The field should auto-save, or click **"Save"** if there's a save button

**Note:** Railway automatically sets `$PORT`, so don't change it to a number.

---

### Step 5: Add Environment Variables (DATABASE_URL)

1. Still in the **Settings** tab, look for:
   - **"Variables"** section (usually below Build/Start commands)
   - OR click the **"Variables"** tab at the top (next to Settings)
2. You'll see a list of environment variables (may be empty)
3. Click the **"+ New Variable"** button (usually green, top right of the Variables section)
4. A dialog or form will appear with two fields:
   - **Key** (or Name)
   - **Value**
5. In the **Key** field, type:
   ```
   DATABASE_URL
   ```
6. In the **Value** field, paste:
   ```
   mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
7. Click **"Add"** or **"Save"** button
8. The variable will appear in the list
9. Railway will automatically start deploying (you'll see a deployment in progress)

---

### Step 6: Verify Backend Deployment

1. Go to the **"Deployments"** tab (top of the service page)
2. You'll see deployment history
3. Wait for the latest deployment to show **"Active"** or **"Success"** (green checkmark)
4. If it shows **"Failed"** (red X), click on it to see logs
5. Go to the **"Logs"** tab to see real-time logs
6. Look for messages like:
   ```
   Application startup complete
   Uvicorn running on...
   ```

#### Test Your Backend:

1. Go to the **"Settings"** tab
2. Scroll to **"Networking"** section
3. You'll see a **"Domain"** or **"Public URL"** section
4. Click **"Generate Domain"** if no domain exists
5. Copy the URL (e.g., `https://your-backend-production.up.railway.app`)
6. Open a new browser tab
7. Visit: `https://your-backend-url.railway.app/health`
8. You should see: `{"status": "healthy", "message": "All services operational"}`

**Save this URL** - you'll need it for Vercel!

---

## Part 2: Deploy MQTT Worker on Railway (Optional)

### Step 1: Create MQTT Worker Service

1. In your Railway project dashboard (main project view, not inside a service)
2. Click **"+ New"** button (top right)
3. Select **"GitHub Repo"** from dropdown
4. Select the same repository: **"SIH-krishi-mithr-main"**
5. A new service will be created

---

### Step 2: Configure MQTT Worker Service

1. **Click on the new service** (it will have a different name or number)
2. Go to **"Settings"** tab

#### Set Build Command:

1. Find **"Build Command"** field
2. Enter:
   ```
   pip install -r requirements_mqtt.txt
   ```

#### Set Start Command:

1. Find **"Start Command"** field
2. Enter:
   ```
   python mqtt_to_mongodb_krishimithr.py
   ```

---

### Step 3: Add Environment Variables for MQTT Worker

1. Go to **"Variables"** tab (or section in Settings)
2. Click **"+ New Variable"**
3. **Key:** `DATABASE_URL`
4. **Value:** 
   ```
   mongodb+srv://trythanay_db_user:o7ldNkPkv99gx8dH@cluster0.gkbyivi.mongodb.net/krishi-mithr?appName=Cluster0
   ```
5. Click **"Add"**
6. Railway will auto-deploy

---

### Step 4: Verify MQTT Worker

1. Go to **"Logs"** tab
2. Wait for deployment to complete
3. You should see:
   ```
   ✅ Connected to MongoDB Atlas
   ✅ Connected to MQTT broker
   📡 Subscribed to topic: krishimithr/sensor/data
   ⏳ Waiting for sensor data...
   ```

---

## Part 3: Update Vercel Frontend

### Step 1: Get Your Railway Backend URL

1. Go back to Railway dashboard
2. Click on your **Backend service** (the FastAPI one)
3. Go to **"Settings"** tab
4. Scroll to **"Networking"** section
5. Find your **Public URL** or **Domain**
6. It will look like: `https://your-backend-production.up.railway.app`
7. **Copy this entire URL** (Ctrl+C or Cmd+C)

---

### Step 2: Open Vercel Dashboard

1. Go to **https://vercel.com/dashboard**
2. Login if needed
3. You'll see a list of your projects
4. Find and **click on** your project: **"SIH-krishi-mithr"** or **"krishi-mithr"** (or similar name)

---

### Step 3: Navigate to Environment Variables

1. In your Vercel project dashboard, look at the top navigation tabs:
   - **Overview**
   - **Deployments**
   - **Analytics**
   - **Settings** ← **Click this tab**
2. In the **Settings** page, look at the left sidebar menu:
   - **General**
   - **Domains**
   - **Environment Variables** ← **Click this**
   - **Git**
   - **Security**
   - etc.
3. Click **"Environment Variables"** in the left sidebar
4. You'll see a list of existing environment variables

---

### Step 4: Update NEXT_PUBLIC_API_URL

1. Look for `NEXT_PUBLIC_API_URL` in the list
2. You have two options:

#### Option A: Edit Existing Variable

1. Find `NEXT_PUBLIC_API_URL` in the list
2. Click the **"Edit"** button (usually a pencil icon or "Edit" text) on the right side of that row
3. A dialog or form will appear
4. The **Key** field should already say `NEXT_PUBLIC_API_URL` (don't change it)
5. In the **Value** field, **delete the old value** (select all and delete)
6. **Paste your Railway backend URL** (the one you copied earlier)
   ```
   https://your-backend-production.up.railway.app
   ```
   **Important:** Make sure there's **NO trailing slash** at the end!
7. Check the checkboxes for:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
8. Click **"Save"** button

#### Option B: Delete and Recreate (if Edit doesn't work)

1. Find `NEXT_PUBLIC_API_URL` in the list
2. Click **"Delete"** or trash icon
3. Confirm deletion
4. Click **"Add New"** button (top right)
5. **Key:** `NEXT_PUBLIC_API_URL`
6. **Value:** Paste your Railway backend URL (no trailing slash!)
7. Check all three environments: Production, Preview, Development
8. Click **"Save"**

---

### Step 5: Verify Environment Variables

After updating, you should see in the list:
- `DATABASE_URL` (should already be there)
- `JWT_SECRET` (should already be there)
- `NEXT_PUBLIC_API_URL` (should now show your Railway URL)

---

### Step 6: Redeploy Vercel

1. Go to **"Deployments"** tab (top navigation)
2. You'll see a list of deployments
3. Find the **latest deployment** (top of the list)
4. Click the **"⋯"** (three dots) button on the right side of that deployment row
5. A dropdown menu will appear
6. Click **"Redeploy"**
7. A confirmation dialog may appear - click **"Redeploy"** to confirm
8. You'll see a new deployment starting
9. Wait 2-3 minutes for deployment to complete
10. The status will change to **"Ready"** (green) when done

---

### Step 7: Verify Everything Works

1. Once Vercel deployment is complete, click on the deployment
2. You'll see a **"Visit"** button or link
3. Click it to open your frontend
4. Open browser **Developer Tools** (F12 or Right-click → Inspect)
5. Go to **"Console"** tab
6. Test the connection:
   ```javascript
   fetch('https://your-backend.railway.app/health')
     .then(r => r.json())
     .then(console.log)
   ```
7. You should see: `{status: "healthy", message: "All services operational"}`
8. If you see CORS errors, check that your Railway backend is running

---

## 📍 Quick Navigation Reference

### Railway Dashboard Locations:

- **New Project:** Dashboard → "+ New Project" (top left)
- **New Service:** Project → "+ New" (top right)
- **Build/Start Commands:** Service → Settings tab → Scroll down
- **Environment Variables:** Service → Variables tab (or Settings → Variables section)
- **Service URL:** Service → Settings → Networking → Public URL
- **Logs:** Service → Logs tab
- **Deployments:** Service → Deployments tab

### Vercel Dashboard Locations:

- **Projects List:** Dashboard home page
- **Project Settings:** Project → Settings tab (top navigation)
- **Environment Variables:** Settings → Environment Variables (left sidebar)
- **Redeploy:** Deployments tab → ⋯ menu → Redeploy
- **Project URL:** Deployments → Latest deployment → Visit button

---

## ✅ Final Checklist

- [ ] Railway backend service created
- [ ] Build command set: `pip install -r requirements.txt`
- [ ] Start command set: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] `DATABASE_URL` added to Railway backend
- [ ] Railway backend deployed successfully
- [ ] Railway backend URL copied
- [ ] `NEXT_PUBLIC_API_URL` updated in Vercel
- [ ] Vercel redeployed
- [ ] Tested connection from Vercel to Railway backend

---

## 🆘 If You Can't Find Something

### Railway:
- Look for tabs at the top: **Deployments, Metrics, Logs, Settings**
- Settings tab has all configuration options
- Variables can be in Settings tab or separate Variables tab
- Use the search bar in Railway dashboard if available

### Vercel:
- Settings is always in the top navigation tabs
- Left sidebar in Settings has all sub-sections
- Environment Variables is always in the left sidebar under Settings
- If you see a different layout, look for "Environment" or "Variables" in menus

---

**Need more help?** Check the Railway and Vercel documentation or their support channels.

