import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route for market price trends from Render backend
 * This avoids CORS issues by making server-side requests
 * GET /api/market-prices-trends-proxy?location=Telangana&days=7
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

    // Get backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sih-krishi-mithr-api.onrender.com'
    const cleanBackendUrl = backendUrl.replace(/\/+$/, '')
    
    // Forward request to Render backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const backendResponse = await fetch(
        `${cleanBackendUrl}/api/market-prices/trends?location=${encodeURIComponent(location)}&days=${days}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      )
      
      clearTimeout(timeoutId)

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text()
        console.error('[MARKET-PRICES-TRENDS-PROXY] Backend error:', backendResponse.status, errorText)
        return NextResponse.json(
          { 
            error: 'Failed to fetch market price trends from backend',
            status: backendResponse.status,
            details: errorText.substring(0, 200)
          },
          { status: backendResponse.status }
        )
      }

      const data = await backendResponse.json()
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
        },
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      throw fetchError // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    console.error('[MARKET-PRICES-TRENDS-PROXY] Error:', error)
    
    // Handle timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout - backend may be slow or unavailable' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch market price trends',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

