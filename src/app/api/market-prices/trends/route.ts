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
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        console.error('[MARKET-PRICES-TRENDS] Backend fetch failed:', fetchError.message)
      }
    } catch (error) {
      console.error('[MARKET-PRICES-TRENDS] Backend proxy error:', error)
    }

    // Fallback to mock trends data
    return NextResponse.json({
      success: true,
      trends: [
        {
          date: new Date().toISOString().split('T')[0],
          average_price: Math.floor(Math.random() * 1000) + 2000,
          trend: 'stable',
          change_percent: (Math.random() * 10 - 5).toFixed(2)
        }
      ],
      location,
      days: parseInt(days),
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

