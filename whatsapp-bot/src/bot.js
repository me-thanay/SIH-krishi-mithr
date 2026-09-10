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
    executablePath: process.env.CHROME_PATH, // set to local Chrome to skip Chromium download
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
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
    
    // Forward to backend webhook
    if (BACKEND_URL) {
      try {
        await axios.post(`${BACKEND_URL}/api/webhook/whatsapp`, {
          from: msg.from,
          body: msg.body,
          timestamp: msg.timestamp,
          type: msg.type,
          isGroup: msg.from.includes('@g.us')
        })
      } catch (err) {
        console.error('Failed to forward to backend:', err?.response?.status, err?.response?.data || err.message)
      }
    }

    // Agricultural keyword responses
    const message = msg.body.toLowerCase()
    
    if (/^kissan|^krishi|^hello|^hi/i.test(message)) {
      await msg.reply(`🌱 Welcome to Krishi Mithr! 

I'm your AI-powered agriculture assistant. Here's what I can help you with:

🌤️ *Weather Updates* - Get current weather and forecasts
🌱 *Soil Analysis* - AI-powered soil health analysis  
📈 *Market Prices* - Real-time commodity prices
🐛 *Pest Detection* - Identify pests and diseases
🔧 *Farming Tools* - Equipment recommendations
💬 *Voice Assistant* - Voice-enabled farming support

Type any of these keywords to get started!`)
    }
    
    else if (/weather|मौसम|వాతావరణం/i.test(message)) {
      // Extract location from message
      const locationMatch = message.match(/weather\s+(.+)|forecast\s+(.+)/i)
      const location = locationMatch ? (locationMatch[1] || locationMatch[2]) : null
      
      if (location) {
        try {
          // Call NASA POWER weather API (no key needed)
          const response = await axios.get(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(location)}&type=current`)
          const weatherData = response.data
          
          if (weatherData.success) {
            const current = weatherData.data.current
            const source = weatherData.source || 'Weather Service'
            await msg.reply(`🌤️ *Weather for ${location}* (${source})

🌡️ Temperature: ${current.temperature.current}°C (feels like ${current.temperature.feels_like}°C)
💧 Humidity: ${current.humidity}%
🌬️ Wind: ${current.wind.speed} m/s
☁️ Conditions: ${current.weather.description}
${current.solar_radiation ? `☀️ Solar Radiation: ${current.solar_radiation} MJ/m²` : ''}
${current.rainfall ? `🌧️ Rainfall: ${current.rainfall} mm` : ''}
${current.evapotranspiration ? `💨 Evapotranspiration: ${current.evapotranspiration} mm` : ''}

*Farming Conditions:*
${current.farming_conditions.irrigation_needed ? '🚰 Irrigation needed' : '✅ Soil moisture adequate'}
${current.farming_conditions.good_growing ? '🌱 Excellent growing conditions' : '⚠️ Monitor crop stress'}
${current.farming_conditions.planting_suitable ? '🌱 Good for planting' : '⏸️ Wait for better conditions'}`)
          } else {
            await msg.reply(`❌ Sorry, couldn't fetch weather data for ${location}. Please try again or share your location.`)
          }
        } catch (error) {
          await msg.reply(`❌ Weather service temporarily unavailable. Please try again later.`)
        }
      } else {
        await msg.reply(`🌤️ *Weather Service*

To get weather updates, please share your location or type:
• "weather [your city]"
• "forecast [your city]"

I'll provide current conditions and farming recommendations!`)
      }
    }
    
    else if (/soil|मिट्टी|నేల|ground/i.test(message)) {
      await msg.reply(`🌱 *Soil Analysis Service*

For soil health analysis, please:
• Share a photo of your soil
• Describe your soil type
• Mention your crop

I'll provide AI-powered soil recommendations!`)
    }
    
    else if (/price|market|rate|भाव|రేటు/i.test(message)) {
      // Extract crop from message
      const cropMatch = message.match(/price\s+(.+)|market\s+(.+)|rate\s+(.+)/i)
      const crop = cropMatch ? (cropMatch[1] || cropMatch[2] || cropMatch[3]) : null
      
      if (crop) {
        try {
          // Call Agmarknet prices API (no key needed)
          const response = await axios.get(`${BACKEND_URL}/api/agmarknet-prices?crop=${encodeURIComponent(crop)}`)
          const priceData = response.data
          
          if (priceData.success) {
            const prices = priceData.data.prices[0]
            const source = priceData.source || 'Market Service'
            await msg.reply(`📈 *Market Prices for ${crop}* (${source})

💰 Min Price: ₹${prices.min_price}/${prices.unit}
💰 Max Price: ₹${prices.max_price}/${prices.unit}
💰 Modal Price: ₹${prices.modal_price}/${prices.unit}
📍 Market: ${prices.market}
📅 Date: ${prices.date}

*Trend:* ${priceData.data.trend}
*Recommendation:* ${priceData.data.recommendation}
*Market Analysis:* ${priceData.data.market_analysis}`)
          } else {
            await msg.reply(`❌ Sorry, couldn't fetch price data for ${crop}. Please try a different crop name.`)
          }
        } catch (error) {
          await msg.reply(`❌ Market price service temporarily unavailable. Please try again later.`)
        }
      } else {
        await msg.reply(`📈 *Market Prices Service*

Get real-time commodity prices by typing:
• "price [crop name]" (e.g., "price rice")
• "market [crop name]"
• "rate [crop name]"

I'll fetch the latest market data!`)
      }
    }
    
    else if (/pest|disease|कीट|రోగం|bug/i.test(message)) {
      await msg.reply(`🐛 *Pest Detection Service*

For pest identification:
• Share a photo of the affected plant
• Describe the symptoms
• Mention your crop type

I'll help identify the pest/disease and suggest treatments!`)
    }
    
    else if (/tool|equipment|उपकरण|పరికరం/i.test(message)) {
      await msg.reply(`🔧 *Farming Tools Service*

I can recommend:
• Equipment for your farm size
• Best tools for your crops
• Dealer network in your area
• Equipment rental options

What type of farming equipment do you need?`)
    }
    
    else if (/fao|statistics|production|global/i.test(message)) {
      // Extract crop from message
      const cropMatch = message.match(/fao\s+(.+)|statistics\s+(.+)|production\s+(.+)/i)
      const crop = cropMatch ? (cropMatch[1] || cropMatch[2] || cropMatch[3]) : 'rice'
      
      try {
        // Call FAO statistics API (no key needed)
        const response = await axios.get(`${BACKEND_URL}/api/fao-statistics?crop=${encodeURIComponent(crop)}&country=India`)
        const faoData = response.data
        
        if (faoData.success) {
          await msg.reply(`📊 *FAO Statistics for ${crop}* (${faoData.source})

🌾 Production: ${faoData.data.production}
📈 Global Rank: ${faoData.data.global_rank}
📊 Trends: ${faoData.data.trends}

*Recommendations:*
${faoData.data.recommendations.map(rec => `• ${rec}`).join('\n')}

*Source:* FAO (Food & Agriculture Organization)`)
        } else {
          await msg.reply(`❌ Sorry, couldn't fetch FAO statistics for ${crop}. Please try a different crop name.`)
        }
      } catch (error) {
        await msg.reply(`❌ FAO statistics service temporarily unavailable. Please try again later.`)
      }
    }
    
    else if (/help|सहायता|సహాయం/i.test(message)) {
      await msg.reply(`🆘 *Help & Support*

Available services:
🌤️ Weather - NASA POWER weather data
🌱 Soil - OpenLandMap soil analysis  
📈 Market - Agmarknet price information
📊 FAO - Global crop statistics
🐛 Pest - Disease identification
🔧 Tools - Equipment recommendations
💬 Voice - Voice assistant

Type any keyword to get started!`)
    }
    
    else if (message.length > 0 && !msg.from.includes('@g.us')) {
      // Default response for unrecognized messages
      await msg.reply(`🤖 I'm still learning! 

For now, I can help with:
• Weather updates
• Soil analysis
• Market prices  
• Pest detection
• Farming tools

Type "help" for more options!`)
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


