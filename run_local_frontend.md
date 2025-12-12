"use client"

## Run the frontend locally (Next.js)

1) Install deps (Node 18)
```bash
npm install
```

2) Create `.env.local` in project root
```
DATABASE_URL=your_mongo_url
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3) Start the dev server
```bash
npm run dev
```
- Should print: `ready - started server on http://localhost:3000`

4) If port 3000 is busy
```bash
PORT=3001 npm run dev
```
- Then open http://localhost:3001

5) Check for errors
- If the browser says “refused to connect”, check the terminal where `npm run dev` is running for errors.
- Common fixes:
  - Re-install deps: `rm -rf node_modules package-lock.json && npm install`
  - Ensure Node 18 is in use.

6) Backend (optional if you need API)
Start FastAPI in another terminal:
```bash
uvicorn app.main:app --reload --port 8000
```
- Make sure `NEXT_PUBLIC_API_URL=http://localhost:8000` points to it.

7) Hard refresh
- After server is running, open http://localhost:3000 (or your custom port) and press Ctrl+Shift+R.

