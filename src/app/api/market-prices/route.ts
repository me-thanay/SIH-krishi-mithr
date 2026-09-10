import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const crop = searchParams.get('crop')
    const location = searchParams.get('location')
    const state = searchParams.get('state') || 'All'
    const mandi = searchParams.get('mandi') || 'All'
    const source = searchParams.get('source') || 'agmarknet' // agmarknet, fao, worldbank

    // Debug logging
    console.log('[MARKET-PRICES] Request params:', { crop, location, state, mandi })

    // If location is provided (not null and not empty), always return data
    if (location && location.trim() !== '') {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sih-krishi-mithr-api.onrender.com'
      const cleanBackendUrl = backendUrl.replace(/\/+$/, '')
      
      // Try backend, but always fallback to mock data
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // Shorter timeout
        
        try {
          const backendResponse = await fetch(
            `${cleanBackendUrl}/api/market-prices?location=${encodeURIComponent(location)}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
            }
          )
          
          clearTimeout(timeoutId)
          
          if (backendResponse.ok) {
            const data = await backendResponse.json()
            return NextResponse.json(data, {
              headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
              },
            })
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          // Silently fall through to mock data
        }
      } catch (error) {
        // Silently fall through to mock data
      }
      
      // Always return mock data if backend fails or unavailable
      console.log('[MARKET-PRICES] Returning mock data for location:', location)
      return getMockLocationPriceData(location)
    }

    // If crop is provided, return crop-based data
    if (crop && crop.trim() !== '') {
    return getMockPriceData(crop, state, mandi, source)
    }

    // If neither location nor crop is provided, return error with helpful message
    console.error('[MARKET-PRICES] Missing required parameter. Location:', location, 'Crop:', crop)
    return NextResponse.json(
      { 
        error: 'Please provide either location or crop parameter',
        received: { location: location || null, crop: crop || null }
      },
      { status: 400 }
    )

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

function getMockPriceData(crop: string, state: string, mandi: string, source: string) {
  const mockData = {
    success: true,
    source,
    crop,
    location: { state, mandi },
    data: {
      commodity: crop,
      state: state,
      mandi: mandi,
      prices: [
        {
          date: new Date().toISOString().split('T')[0],
          min_price: Math.floor(Math.random() * 1000) + 1500,
          max_price: Math.floor(Math.random() * 1000) + 2500,
          modal_price: Math.floor(Math.random() * 1000) + 2000,
          unit: 'Quintal',
          market: mandi || 'Local Market'
        }
      ],
      trend: 'stable',
      recommendation: getPriceRecommendation(crop)
    },
    timestamp: new Date().toISOString(),
    note: '🌱 Mock data for testing. Get real data by integrating with Agmarknet API.'
  }

  return NextResponse.json(mockData)
}

function getMockLocationPriceData(location: string) {
  // Mock data in the format expected by the backend API (MarketPricesResponse)
  const commonCrops = [
    { commodity: 'Rice', price: 2850, unit: 'quintal', change: 5.2, status: 'up' },
    { commodity: 'Wheat', price: 2200, unit: 'quintal', change: -2.1, status: 'down' },
    { commodity: 'Maize', price: 1950, unit: 'quintal', change: 3.5, status: 'up' },
    { commodity: 'Cotton', price: 6500, unit: 'quintal', change: 1.8, status: 'up' },
    { commodity: 'Sugarcane', price: 320, unit: 'quintal', change: -0.5, status: 'down' },
  ]

  return NextResponse.json({
    location: location,
    prices: commonCrops,
    last_updated: new Date().toISOString(),
    note: 'Mock data - backend unavailable'
  })
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
