import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { crop, source } = req.query

    if (!crop) {
      return res.status(400).json({ error: 'Crop parameter is required' })
    }

    // Try to fetch from Agmarknet first if source is specified
    if (source === 'agmarknet') {
      try {
        const agmarknetResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/agmarknet-prices?crop=${encodeURIComponent(crop as string)}`)
        const agmarknetData = await agmarknetResponse.json()
        
        if (agmarknetData.success) {
          return res.status(200).json({
            success: true,
            data: {
              crop: agmarknetData.data.crop,
              min_price: agmarknetData.data.minPrice,
              max_price: agmarknetData.data.maxPrice,
              modal_price: agmarknetData.data.modalPrice,
              trend: agmarknetData.data.trend,
              recommendation: agmarknetData.data.recommendation,
              last_updated: agmarknetData.data.lastUpdated,
              source: agmarknetData.data.source,
              market_data: agmarknetData.data.marketData
            },
            message: `Agmarknet prices for ${crop}`
          })
        }
      } catch (agmarknetError) {
        console.log('Agmarknet API not available, falling back to mock data')
      }
    }

    // Fallback to enhanced mock data
    const basePrices: { [key: string]: { min: number, max: number, modal: number } } = {
      'Rice': { min: 1800, max: 2200, modal: 2000 },
      'Wheat': { min: 1900, max: 2300, modal: 2100 },
      'Maize': { min: 1600, max: 2000, modal: 1800 },
      'Cotton': { min: 5500, max: 6500, modal: 6000 },
      'Sugarcane': { min: 280, max: 320, modal: 300 },
      'Soybean': { min: 3200, max: 3800, modal: 3500 },
      'Groundnut': { min: 4800, max: 5500, modal: 5150 },
      'Sunflower': { min: 4200, max: 4800, modal: 4500 },
      'Mustard': { min: 3800, max: 4200, modal: 4000 },
      'Potato': { min: 800, max: 1200, modal: 1000 },
      'Tomato': { min: 3000, max: 4000, modal: 3500 },
      'Onion': { min: 2500, max: 3500, modal: 3000 }
    }

    const cropKey = (crop as string).charAt(0).toUpperCase() + (crop as string).slice(1).toLowerCase()
    const basePrice = basePrices[cropKey] || { min: 1000, max: 1500, modal: 1250 }
    
    // Add realistic variation
    const variation = (Math.random() - 0.5) * 0.15 // ±7.5% variation
    const minPrice = Math.round(basePrice.min * (1 + variation))
    const maxPrice = Math.round(basePrice.max * (1 + variation))
    const modalPrice = Math.round(basePrice.modal * (1 + variation))

    // Determine trend based on recent price movement
    const priceChange = (Math.random() - 0.5) * 0.1 // ±5% change
    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    if (priceChange > 0.03) trend = 'rising'
    else if (priceChange < -0.03) trend = 'falling'

    // Generate realistic recommendation
    let recommendation = ''
    if (trend === 'rising') {
      recommendation = `Prices for ${cropKey} are rising. Consider selling soon to maximize profits.`
    } else if (trend === 'falling') {
      recommendation = `Prices for ${cropKey} are falling. Consider holding or finding alternative markets.`
    } else {
      recommendation = `Prices for ${cropKey} are stable. Good time for regular trading.`
    }

    const mockMarketData = {
      crop: cropKey,
      min_price: minPrice,
      max_price: maxPrice,
      modal_price: modalPrice,
      trend,
      recommendation,
      last_updated: new Date().toISOString(),
      source: 'Krishi Mithr Market Data',
      market: 'Local Mandi',
      note: 'Enhanced mock data based on real market patterns. Use ?source=agmarknet for Agmarknet integration.'
    }

    return res.status(200).json({
      success: true,
      data: mockMarketData,
      message: `Market prices for ${cropKey}`
    })

  } catch (error) {
    console.error('Market prices API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
