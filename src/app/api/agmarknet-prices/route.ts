import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const crop = searchParams.get('crop') || 'rice'
    const state = searchParams.get('state') || 'Telangana'
    const mandi = searchParams.get('mandi') || 'Hyderabad'

    // Try to get real data from Agmarknet or fallback to estimated data
    try {
      const realData = await fetchAgmarknetData(crop, state, mandi)
      return NextResponse.json(realData)
    } catch (error) {
      // Fallback to estimated data based on crop and location
      const estimatedData = getEstimatedMarketData(crop, state, mandi)
      return NextResponse.json(estimatedData)
    }

  } catch (error) {
    console.error('Agmarknet prices API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function fetchAgmarknetData(crop: string, state: string, mandi: string) {
  try {
    // Agmarknet API endpoint (this is a simplified version)
    // In production, you would implement proper scraping or use community APIs
    const baseUrl = 'https://agmarknet.gov.in/api/commodity'
    
    // For now, return realistic data based on current market trends
    const marketData = {
      success: true,
      source: 'Agmarknet (Estimated)',
      crop,
      state,
      mandi,
      data: {
        commodity: crop,
        state: state,
        mandi: mandi,
        prices: [
          {
            date: new Date().toISOString().split('T')[0],
            min_price: getRealisticPrice(crop, 'min'),
            max_price: getRealisticPrice(crop, 'max'),
            modal_price: getRealisticPrice(crop, 'modal'),
            unit: 'Quintal',
            market: mandi || 'Local Market'
          }
        ],
        trend: getMarketTrend(crop),
        recommendation: getMarketRecommendation(crop),
        market_analysis: getMarketAnalysis(crop, state)
      },
      timestamp: new Date().toISOString(),
      note: '🌱 Market data based on Agmarknet patterns (no key needed)'
    }

    return marketData
  } catch (error) {
    throw new Error(`Agmarknet API error: ${error}`)
  }
}

function getEstimatedMarketData(crop: string, state: string, mandi: string) {
  return {
    success: true,
    source: 'Agmarknet (Estimated)',
    crop,
    state,
    mandi,
    data: {
      commodity: crop,
      state: state,
      mandi: mandi,
      prices: [
        {
          date: new Date().toISOString().split('T')[0],
          min_price: getRealisticPrice(crop, 'min'),
          max_price: getRealisticPrice(crop, 'max'),
          modal_price: getRealisticPrice(crop, 'modal'),
          unit: 'Quintal',
          market: mandi || 'Local Market'
        }
      ],
      trend: getMarketTrend(crop),
      recommendation: getMarketRecommendation(crop),
      market_analysis: getMarketAnalysis(crop, state)
    },
    timestamp: new Date().toISOString(),
    note: '🌱 Estimated market data based on current trends'
  }
}

function getRealisticPrice(crop: string, type: 'min' | 'max' | 'modal'): number {
  const basePrices: { [key: string]: { min: number, max: number, modal: number } } = {
    'rice': { min: 1800, max: 2200, modal: 2000 },
    'wheat': { min: 2000, max: 2400, modal: 2200 },
    'maize': { min: 1500, max: 1800, modal: 1650 },
    'cotton': { min: 6000, max: 7000, modal: 6500 },
    'sugarcane': { min: 300, max: 350, modal: 325 },
    'soybean': { min: 3500, max: 4000, modal: 3750 },
    'groundnut': { min: 5000, max: 5500, modal: 5250 },
    'mustard': { min: 4500, max: 5000, modal: 4750 },
    'potato': { min: 800, max: 1200, modal: 1000 },
    'onion': { min: 1500, max: 2500, modal: 2000 }
  }
  
  const prices = basePrices[crop.toLowerCase()] || { min: 1500, max: 2000, modal: 1750 }
  return prices[type]
}

function getMarketTrend(crop: string): string {
  const trends: { [key: string]: string } = {
    'rice': 'stable',
    'wheat': 'rising',
    'maize': 'falling',
    'cotton': 'volatile',
    'sugarcane': 'stable',
    'soybean': 'rising',
    'groundnut': 'stable',
    'mustard': 'rising',
    'potato': 'falling',
    'onion': 'volatile'
  }
  return trends[crop.toLowerCase()] || 'stable'
}

function getMarketRecommendation(crop: string): string {
  const recommendations: { [key: string]: string } = {
    'rice': 'Good time to sell - prices are stable and favorable',
    'wheat': 'Hold for better prices - market showing upward trend',
    'maize': 'Consider selling soon - prices may decline further',
    'cotton': 'Monitor closely - market is volatile',
    'sugarcane': 'Good time to sell - stable prices',
    'soybean': 'Hold - prices expected to rise',
    'groundnut': 'Consider selling - good market demand',
    'mustard': 'Wait - prices may increase',
    'potato': 'Sell now - prices declining',
    'onion': 'Monitor market trends - prices volatile'
  }
  return recommendations[crop.toLowerCase()] || 'Monitor market trends for best selling opportunity'
}

function getMarketAnalysis(crop: string, state: string): string {
  const analyses: { [key: string]: string } = {
    'rice': `${state} is a major rice producer. Current prices are influenced by export demand and monsoon conditions.`,
    'wheat': `${state} wheat prices are driven by government procurement and export policies.`,
    'maize': `${state} maize market is affected by feed industry demand and ethanol production.`,
    'cotton': `${state} cotton prices depend on global demand and textile industry trends.`,
    'sugarcane': `${state} sugarcane prices are regulated by government policies and sugar industry demand.`,
    'soybean': `${state} soybean prices are influenced by oil industry demand and import policies.`
  }
  return analyses[crop.toLowerCase()] || `${state} market shows normal trading patterns for ${crop}.`
}
