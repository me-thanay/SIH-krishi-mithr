# Test Login Endpoint

## Correct Test Command

Replace `your-vercel-app.vercel.app` with your actual Vercel URL: `krishi-mithr.vercel.app`

```javascript
fetch('https://krishi-mithr.vercel.app/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
})
  .then(async (r) => {
    const data = await r.json()
    console.log('Status:', r.status)
    console.log('Response:', data)
    return data
  })
  .catch(console.error)
```

## Important Notes

1. **Login endpoint is on Vercel** (`krishi-mithr.vercel.app/api/auth/login`)
   - This is a Next.js API route
   - NOT on Render

2. **Render backend** (`sih-krishi-mithr.onrender.com`) is for:
   - Market prices
   - Weather data
   - Soil analysis
   - Other agricultural APIs

3. **Authentication endpoints** are on Vercel:
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/auth/profile`

## Expected Responses

### ✅ Success (200):
```json
{
  "success": true,
  "user": {...},
  "token": "...",
  "message": "Login successful"
}
```

### ❌ Missing DATABASE_URL (500):
```json
{
  "error": "Server configuration error: DATABASE_URL missing"
}
```

### ❌ Missing JWT_SECRET (500):
```json
{
  "error": "Server configuration error: JWT_SECRET missing"
}
```

### ❌ User not found (401):
```json
{
  "error": "Invalid email or password"
}
```



























