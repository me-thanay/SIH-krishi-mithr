import { NextRequest, NextResponse } from 'next/server'

// Mock market prices data for testing without API keys
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const crop = searchParams.get('crop') || 'rice'

    // Mock price data
    const mockPriceData = {
      success: true,
      source: 'agmarknet',
      crop,
      location: { state: 'Telangana', mandi: 'Hyderabad' },
      data: {
        commodity: crop,
        state: 'Telangana',
        mandi: 'Hyderabad',
        prices: [
          {
            date: new Date().toISOString().split('T')[0],
            min_price: Math.floor(Math.random() * 1000) + 1500,
            max_price: Math.floor(Math.random() * 1000) + 2500,
            modal_price: Math.floor(Math.random() * 1000) + 2000,
            unit: 'Quintal',
            market: 'Hyderabad Market'
          }
        ],
        trend: 'stable',
        recommendation: getMockPriceRecommendation(crop)
      },
      timestamp: new Date().toISOString(),
      note: 'This is mock data for testing. Get real data by integrating with Agmarknet API.'
    }

    return NextResponse.json(mockPriceData)

  } catch (error) {
    console.error('Mock market prices API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch mock market prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getMockPriceRecommendation(crop: string): string {
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
