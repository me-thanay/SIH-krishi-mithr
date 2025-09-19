require('dotenv').config()
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const express = require('express')
const axios = require('axios')

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 4000
const BACKEND_URL = process.env.BACKEND_URL || ''

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
})

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true })
  console.log('\nScan the QR code above with your WhatsApp')
})

client.on('ready', () => {
  console.log('WhatsApp client is ready!')
})

client.on('message', async (msg) => {
  try {
    console.log(`[INCOMING] ${msg.from}: ${msg.body}`)

    // Forward to backend webhook if configured
    if (BACKEND_URL) {
      try {
        await axios.post(`${BACKEND_URL}/api/webhook/whatsapp`, {
          from: msg.from,
          body: msg.body,
          timestamp: msg.timestamp
        })
      } catch (err) {
        console.error('Failed to forward to backend:', err?.response?.status, err?.response?.data || err.message)
      }
    }

    // Simple auto-reply for testing
    if (/^kissan/i.test(msg.body)) {
      await msg.reply('👋 Kissan keyword detected. How can I help you?')
    }
  } catch (e) {
    console.error('Error handling message:', e)
  }
})

// Simple HTTP API to send messages
app.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body
    if (!to || !message) return res.status(400).json({ error: 'to and message are required' })

    // Ensure correct WhatsApp ID format
    const chatId = to.replace(/[^0-9]/g, '') + '@c.us'
    await client.sendMessage(chatId, message)
    return res.json({ ok: true })
  } catch (e) {
    console.error('Send API error:', e)
    return res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`HTTP API listening on http://localhost:${PORT}`)
})

client.initialize()


