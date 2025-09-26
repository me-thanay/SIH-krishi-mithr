import { NextApiRequest, NextApiResponse } from 'next'

interface AgmarknetPriceData {
  commodity: string
  state: string
  district: string
  market: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  date: string
  arrival: number
}

interface CropMapping {
  [key: string]: {
    commodityId: string
    commodityName: string
    states: string[]
  }
}

// Mapping of common crops to Agmarknet commodity IDs and names
const cropMappings: CropMapping = {
  'rice': {
    commodityId: '1',
    commodityName: 'Rice',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'wheat': {
    commodityId: '2',
    commodityName: 'Wheat',
    states: ['BR', 'CT', 'GJ', 'HR', 'HP', 'JK', 'JH', 'MP', 'MH', 'PB', 'RJ', 'UP', 'UK']
  },
  'maize': {
    commodityId: '3',
    commodityName: 'Maize',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'sugarcane': {
    commodityId: '4',
    commodityName: 'Sugarcane',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'cotton': {
    commodityId: '5',
    commodityName: 'Cotton',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'soybean': {
    commodityId: '6',
    commodityName: 'Soybean',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'groundnut': {
    commodityId: '7',
    commodityName: 'Groundnut',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'sunflower': {
    commodityId: '8',
    commodityName: 'Sunflower',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'mustard': {
    commodityId: '9',
    commodityName: 'Mustard',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  },
  'potato': {
    commodityId: '10',
    commodityName: 'Potato',
    states: ['AP', 'AS', 'BR', 'CT', 'GA', 'GJ', 'HR', 'HP', 'JK', 'JH', 'KA', 'KL', 'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OR', 'PB', 'RJ', 'SK', 'TN', 'TG', 'TR', 'UP', 'UK', 'WB']
  }
}

// Function to generate mock data based on real market trends
function generateMockAgmarknetData(crop: string, state?: string): AgmarknetPriceData[] {
  const cropMapping = cropMappings[crop.toLowerCase()]
  if (!cropMapping) {
    return []
  }

  const basePrices: { [key: string]: { min: number, max: number, modal: number } } = {
    'rice': { min: 1800, max: 2200, modal: 2000 },
    'wheat': { min: 1900, max: 2300, modal: 2100 },
    'maize': { min: 1600, max: 2000, modal: 1800 },
    'sugarcane': { min: 280, max: 320, modal: 300 },
    'cotton': { min: 5500, max: 6500, modal: 6000 },
    'soybean': { min: 3200, max: 3800, modal: 3500 },
    'groundnut': { min: 4800, max: 5500, modal: 5150 },
    'sunflower': { min: 4200, max: 4800, modal: 4500 },
    'mustard': { min: 3800, max: 4200, modal: 4000 },
    'potato': { min: 800, max: 1200, modal: 1000 }
  }

  const basePrice = basePrices[crop.toLowerCase()] || { min: 1000, max: 1500, modal: 1250 }
  
  // Generate data for multiple markets
  const markets = [
    { state: 'MH', district: 'Pune', market: 'Pune APMC' },
    { state: 'KA', district: 'Bangalore', market: 'Bangalore APMC' },
    { state: 'TN', district: 'Chennai', market: 'Chennai APMC' },
    { state: 'GJ', district: 'Ahmedabad', market: 'Ahmedabad APMC' },
    { state: 'UP', district: 'Lucknow', market: 'Lucknow APMC' }
  ]

  return markets.map((market, index) => {
    const variation = (Math.random() - 0.5) * 0.2 // ±10% variation
    const minPrice = Math.round(basePrice.min * (1 + variation))
    const maxPrice = Math.round(basePrice.max * (1 + variation))
    const modalPrice = Math.round(basePrice.modal * (1 + variation))
    
    return {
      commodity: cropMapping.commodityName,
      state: market.state,
      district: market.district,
      market: market.market,
      minPrice,
      maxPrice,
      modalPrice,
      date: new Date().toISOString().split('T')[0],
      arrival: Math.floor(Math.random() * 1000) + 100
    }
  })
}

// Function to fetch real data from Agmarknet (placeholder for future implementation)
async function fetchRealAgmarknetData(crop: string, state?: string): Promise<AgmarknetPriceData[]> {
  try {
    // This would be the actual implementation to fetch from Agmarknet
    // For now, we'll return mock data that simulates real market conditions
    console.log(`Fetching Agmarknet data for ${crop} in ${state || 'all states'}`)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return generateMockAgmarknetData(crop, state)
  } catch (error) {
    console.error('Error fetching Agmarknet data:', error)
    throw new Error('Failed to fetch Agmarknet data')
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { crop, state } = req.query

  if (!crop || typeof crop !== 'string') {
    return res.status(400).json({ 
      error: 'Crop parameter is required',
      availableCrops: Object.keys(cropMappings)
    })
  }

  try {
    const cropLower = crop.toLowerCase()
    
    if (!cropMappings[cropLower]) {
      return res.status(400).json({ 
        error: `Crop "${crop}" not found`,
        availableCrops: Object.keys(cropMappings)
      })
    }

    const agmarknetData = await fetchRealAgmarknetData(cropLower, state as string)
    
    if (agmarknetData.length === 0) {
      return res.status(404).json({ 
        error: `No price data found for ${crop}`,
        message: 'Try a different crop or check back later'
      })
    }

    // Calculate average prices across all markets
    const avgMinPrice = Math.round(agmarknetData.reduce((sum, data) => sum + data.minPrice, 0) / agmarknetData.length)
    const avgMaxPrice = Math.round(agmarknetData.reduce((sum, data) => sum + data.maxPrice, 0) / agmarknetData.length)
    const avgModalPrice = Math.round(agmarknetData.reduce((sum, data) => sum + data.modalPrice, 0) / agmarknetData.length)

    // Determine trend based on price variation
    const priceVariation = (avgMaxPrice - avgMinPrice) / avgModalPrice
    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    if (priceVariation > 0.15) trend = 'rising'
    else if (priceVariation < 0.05) trend = 'falling'

    // Generate recommendation based on trend and prices
    let recommendation = ''
    if (trend === 'rising') {
      recommendation = 'Prices are rising. Consider selling soon to maximize profits.'
    } else if (trend === 'falling') {
      recommendation = 'Prices are falling. Consider holding or finding alternative markets.'
    } else {
      recommendation = 'Prices are stable. Good time for regular trading.'
    }

    const cropMapping = cropMappings[cropLower]
    
    const response = {
      success: true,
      data: {
        crop: cropMapping.commodityName,
        minPrice: avgMinPrice,
        maxPrice: avgMaxPrice,
        modalPrice: avgModalPrice,
        trend,
        recommendation,
        source: 'Agmarknet (Simulated)',
        lastUpdated: new Date().toISOString(),
        marketData: agmarknetData,
        note: 'This is simulated data based on Agmarknet patterns. Real integration would fetch live data from agmarknet.gov.in'
      },
      message: `Price data for ${cropMapping.commodityName} from Agmarknet`
    }

    res.status(200).json(response)

  } catch (error: any) {
    console.error('Agmarknet API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch crop prices from Agmarknet',
      fallback: 'Consider using the regular market-prices API'
    })
  }
}
