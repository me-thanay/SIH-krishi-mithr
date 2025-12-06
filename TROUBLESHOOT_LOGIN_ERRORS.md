# 🔧 Troubleshooting Login Errors (404 & 500)

## Understanding the Errors

### Error 1: `Failed to load resource: the server responded with a status of 404`
This means a resource (API endpoint, image, or file) was not found.

### Error 2: `/api/auth/login:1 Failed to load resource: the server responded with a status of 500`
This means the login endpoint exists but encountered an internal server error.

## Common Causes & Solutions

### 1. Missing Environment Variables (Most Common)

The 500 error is usually caused by missing environment variables.

#### Required Environment Variables:
```bash
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/krishi-mithr
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### How to Check:
1. **Local Development**: Create a `.env.local` file in the project root:
   ```bash
   DATABASE_URL=your_mongodb_connection_string
   JWT_SECRET=generate_a_strong_random_64_char_string
   ```

2. **Vercel/Production**: 
   - Go to your Vercel project → Settings → Environment Variables
   - Ensure both `DATABASE_URL` and `JWT_SECRET` are set
   - Redeploy after adding variables

3. **Test Configuration**: Visit `/api/health` to check your configuration:
   ```bash
   curl http://localhost:3000/api/health
   ```

### 2. Database Connection Issues

#### Symptoms:
- Error code: `P1001`, `P1017`, or `P2010`
- Message: "Database connection failed"

#### Solutions:
1. **Verify DATABASE_URL**:
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
   - Ensure MongoDB Atlas network access allows your IP
   - Check if database user has correct permissions

2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Test Connection**:
   ```bash
   npx prisma db pull
   ```

### 3. Routing Conflicts

The project has both App Router and Pages Router login endpoints:
- ✅ **App Router**: `src/app/api/auth/login/route.ts` (Active)
- ⚠️ **Pages Router**: `pages/api/auth/login.ts` (Deprecated)

**Next.js 13+ automatically uses App Router when both exist**, so the App Router version takes precedence.

### 4. 404 Errors from Other Endpoints

The dashboard calls several API endpoints. Check which one is returning 404:

#### Endpoints Used by Dashboard:
- `/api/auth/profile` - User profile (App Router: ✅, Pages Router: ✅)
- `/api/sensor-data/latest` - Latest sensor data (Pages Router: ✅)
- `/api/sensor-data/history` - Sensor history (Pages Router: ✅)
- `/api/mqtt/control` - MQTT control (App Router: ✅)

#### How to Identify:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for failed requests (red status)
4. Check the Request URL to see which endpoint is failing

## Diagnostic Steps

### Step 1: Check Health Endpoint
```bash
# Local
curl http://localhost:3000/api/health

# Production
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "environment": {
    "hasDatabaseUrl": true,
    "hasJwtSecret": true,
    "databaseConnection": "connected"
  }
}
```

### Step 2: Test Login Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "loginMethod": "phone"}'
```

### Step 3: Check Server Logs
- **Local**: Check terminal where `npm run dev` is running
- **Vercel**: Go to Deployments → Click deployment → Functions → View logs

Look for:
- `[LOGIN ERROR]` - Login-specific errors
- `DATABASE_URL is not set` - Missing environment variable
- `Database connection error` - Database issues

### Step 4: Verify Environment Variables
```bash
# In your terminal (local development)
echo $DATABASE_URL
echo $JWT_SECRET

# Or check .env.local file
cat .env.local
```

## Quick Fixes

### Fix 1: Add Missing Environment Variables
```bash
# Create .env.local file
cat > .env.local << EOF
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/krishi-mithr
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
```

### Fix 2: Regenerate Prisma Client
```bash
npx prisma generate
npx prisma db push
```

### Fix 3: Restart Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Error Messages Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `P1001` | Can't reach database server | Check DATABASE_URL and network access |
| `P1017` | Connection closed | Restart server, check database status |
| `P2010` | Query execution failed | Run `npx prisma generate` |
| `P2002` | Constraint violation | Duplicate record exists |
| `DB_CONFIG_ERROR` | Database not configured | Set DATABASE_URL |
| `JWT_CONFIG_ERROR` | JWT not configured | Set JWT_SECRET |

## Still Having Issues?

1. **Check the health endpoint**: `/api/health`
2. **Review server logs**: Look for `[LOGIN ERROR]` messages
3. **Verify environment variables**: Use the health endpoint
4. **Test database connection**: Use Prisma Studio or MongoDB Compass
5. **Check browser console**: Look for additional error details

## Support

If issues persist:
1. Check `/api/health` endpoint for diagnostics
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure database is accessible and Prisma client is generated

