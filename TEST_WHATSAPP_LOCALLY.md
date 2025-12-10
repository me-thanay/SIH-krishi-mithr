# Testing WhatsApp API Locally

## Step 1: Create `.env.local` file

Create a `.env.local` file in the project root with your WhatsApp API credentials:

```env
# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Database (for login functionality)
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Step 2: Get Your WhatsApp API Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your WhatsApp Business API app
3. Get your:
   - **Access Token** (from App Dashboard → WhatsApp → API Setup)
   - **Phone Number ID** (from App Dashboard → WhatsApp → API Setup)

## Step 3: Test the API Endpoint

### Option 1: Test via Browser Console

Open browser console (F12) and run:

```javascript
fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phoneNumber: '7670997498',
    message: 'kissan'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e))
```

### Option 2: Test via curl

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "7670997498", "message": "kissan"}'
```

### Option 3: Test via Component

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Click the "Support" button in the navigation
4. Check browser console for any errors
5. Check terminal for API logs

## Expected Behavior

- **If API credentials are set correctly**: Message "kissan" will be automatically sent to +91 76709 97498
- **If API credentials are missing**: Will fallback to opening WhatsApp with message pre-filled

## Troubleshooting

### Error: "WhatsApp API not configured"
- Make sure `.env.local` file exists in project root
- Make sure environment variables are named correctly (no typos)
- Restart the dev server after adding environment variables

### Error: "Failed to send WhatsApp message"
- Check if your WhatsApp API credentials are valid
- Verify phone number format (should be without + and spaces)
- Check Meta Developer Console for API errors

### Message not received
- Verify the phone number is correct: +91 76709 97498
- Check if the recipient has opted in to receive messages
- Verify your WhatsApp Business API account is active

## Testing Checklist

- [ ] `.env.local` file created with WhatsApp credentials
- [ ] Dev server restarted after adding environment variables
- [ ] Tested API endpoint via browser console
- [ ] Verified message is sent successfully
- [ ] Checked fallback behavior when API is not configured

