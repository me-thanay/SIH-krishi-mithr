# 🚀 Local Development Setup

## Quick Start

1. **Create `.env.local` file** in the root directory with:

```bash
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority
JWT_SECRET=7158a9b3b23b6d4f6d0e7f0a4c1b9d5e4c7f2a1d8e3c6b5a9f0d7c8b2a1e4f6
NEXT_PUBLIC_API_URL=http://localhost:8000
```

2. **Install dependencies** (if not already done):
```bash
npm install
```

3. **Generate Prisma Client**:
```bash
npx prisma generate
```

4. **Start development server**:
```bash
npm run dev
```

5. **Access the app**:
- Frontend: http://localhost:3000
- Signup: http://localhost:3000/auth/signup
- Login: http://localhost:3000/auth/login

## Environment Variables

### Required:
- `DATABASE_URL` - Your MongoDB Atlas connection string
- `JWT_SECRET` - A secure random string for JWT tokens (use the one provided above or generate your own)

### Optional:
- `NEXT_PUBLIC_API_URL` - Backend API URL (if using external backend)
- `OPENWEATHER_API_KEY` - For weather API (optional)

## Generate JWT_SECRET

If you want to generate your own JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Troubleshooting

### Signup/Login Errors:

1. **400 Error on Signup**: Make sure you're sending `phone` (10 digits) and `faceImage` (base64 string)

2. **500 Error on Login**: 
   - Check that `JWT_SECRET` is set in `.env.local`
   - Check that `DATABASE_URL` is correct
   - Restart the dev server after adding environment variables

3. **Weather API 400 Error**: This is expected - weather API is disabled/stubbed. Ignore this error.

### Database Connection:

- Make sure MongoDB Atlas allows connections from your IP (or use Network Access: Allow All)
- Check that `DATABASE_URL` is correct and includes the database name

## Notes

- The `.env.local` file is gitignored - it won't be committed
- Restart the dev server after changing environment variables
- Prisma Client needs to be regenerated if schema changes

