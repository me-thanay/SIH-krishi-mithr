import { NextRequest, NextResponse } from 'next/server'

/**
 * Market price trends endpoint
 * GET /api/market-prices/trends?location=Telangana&days=7
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const days = searchParams.get('days') || '7'
    
    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      )
    }

    // Try to fetch from Render backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sih-krishi-mithr-api.onrender.com'
    const cleanBackendUrl = backendUrl.replace(/\/+$/, '')
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      try {
        const backendResponse = await fetch(
          `${cleanBackendUrl}/api/market-prices/trends?location=${encodeURIComponent(location)}&days=${days}`,
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
        } else {
          // Backend returned error, use fallback mock data
          console.error('[MARKET-PRICES-TRENDS] Backend returned error:', backendResponse.status)
          return getMockTrendsData(location, parseInt(days))
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        console.error('[MARKET-PRICES-TRENDS] Backend fetch failed:', fetchError.message)
        return getMockTrendsData(location, parseInt(days))
      }
    } catch (error) {
      console.error('[MARKET-PRICES-TRENDS] Backend proxy error:', error)
      return getMockTrendsData(location, parseInt(days))
    }

  } catch (error) {
    console.error('Market price trends API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market price trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function getMockTrendsData(location: string, days: number) {
  // Mock trends data in the format expected by the backend API (TrendResponse)
  const commodities = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane']
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  const trendTypes = ['rising', 'falling', 'stable']
  
  const trends = commodities.map((commodity, index) => {
    const dataPoints = []
    const basePrice = 1500 + Math.random() * 1000
    
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        price: Math.floor(basePrice + (Math.random() * 200 - 100))
      })
    }
    
    return {
      commodity,
      data: dataPoints,
      color: colors[index % colors.length],
      trend: trendTypes[Math.floor(Math.random() * trendTypes.length)]
    }
  })
  
  return NextResponse.json({
    location: location,
    trends: trends,
    last_updated: new Date().toISOString(),
    note: 'Mock trends data - backend unavailable'
  })

  } catch (error) {
    console.error('Market price trends API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market price trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

