import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const crop = searchParams.get('crop')
    const state = searchParams.get('state') || 'All'
    const mandi = searchParams.get('mandi') || 'All'
    const source = searchParams.get('source') || 'agmarknet' // agmarknet, fao, worldbank

    if (!crop) {
      return NextResponse.json(
        { error: 'Please provide crop name' },
        { status: 400 }
      )
    }

    let data: any = {}

    if (source === 'agmarknet') {
      data = await fetchAgmarknetData(crop, state, mandi)
    } else if (source === 'fao') {
      data = await fetchFAOData(crop)
    } else if (source === 'worldbank') {
      data = await fetchWorldBankData(crop)
    }

    return NextResponse.json({
      success: true,
      source,
      crop,
      location: { state, mandi },
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Market prices API error:', error)
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
    // In production, you might need to scrape or use a wrapper
    const baseUrl = 'https://agmarknet.gov.in/api/commodity'
    
    // For now, return mock data structure
    // In production, implement actual API calls or scraping
    return {
      commodity: crop,
      state: state,
      mandi: mandi,
      prices: [
        {
          date: new Date().toISOString().split('T')[0],
          min_price: Math.floor(Math.random() * 1000) + 1000,
          max_price: Math.floor(Math.random() * 1000) + 2000,
          modal_price: Math.floor(Math.random() * 1000) + 1500,
          unit: 'Quintal',
          market: mandi || 'Local Market'
        }
      ],
      trend: 'stable', // rising, falling, stable
      recommendation: getPriceRecommendation(crop)
    }
  } catch (error) {
    throw new Error(`Agmarknet API error: ${error}`)
  }
}

async function fetchFAOData(crop: string) {
  try {
    // FAO API endpoint
    const baseUrl = 'https://fenixservices.fao.org/faostat/api/v1/en/data'
    
    // Mock FAO data structure
    return {
      commodity: crop,
      source: 'FAO',
      global_prices: [
        {
          year: new Date().getFullYear(),
          price: Math.floor(Math.random() * 500) + 500,
          unit: 'USD/MT',
          region: 'Global'
        }
      ],
      trend: 'rising',
      recommendation: getPriceRecommendation(crop)
    }
  } catch (error) {
    throw new Error(`FAO API error: ${error}`)
  }
}

async function fetchWorldBankData(crop: string) {
  try {
    // World Bank API endpoint
    const baseUrl = 'https://api.worldbank.org/v2/country/IND/indicator'
    
    // Mock World Bank data structure
    return {
      commodity: crop,
      source: 'World Bank',
      prices: [
        {
          year: new Date().getFullYear(),
          price: Math.floor(Math.random() * 300) + 200,
          unit: 'USD/MT',
          country: 'India'
        }
      ],
      trend: 'stable',
      recommendation: getPriceRecommendation(crop)
    }
  } catch (error) {
    throw new Error(`World Bank API error: ${error}`)
  }
}

function getPriceRecommendation(crop: string): string {
  const recommendations: { [key: string]: string } = {
    'rice': 'Good time to sell - prices are favorable',
    'wheat': 'Hold for better prices - market showing upward trend',
    'maize': 'Consider selling - prices at peak',
    'cotton': 'Wait for better prices - market volatile',
    'sugarcane': 'Good time to sell - stable prices',
    'soybean': 'Hold - prices expected to rise',
    'groundnut': 'Consider selling - good market demand',
    'mustard': 'Wait - prices may increase',
    'potato': 'Sell now - prices declining',
    'onion': 'Hold - prices expected to rise'
  }
  
  return recommendations[crop.toLowerCase()] || 'Monitor market trends for best selling opportunity'
}
