import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command } = body

    if (!command) {
      return NextResponse.json(
        { success: false, error: 'Command is required' },
        { status: 400 }
      )
    }

    // Check if backend URL is configured
    if (!BACKEND_URL || BACKEND_URL === 'http://localhost:8000') {
      console.warn('⚠️ BACKEND_URL not configured, using default:', BACKEND_URL)
    }

    // Forward to FastAPI backend with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/api/mqtt/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { detail: errorText || 'Failed to send command' }
        }
        
        console.error(`❌ Backend returned ${response.status}:`, errorData)
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.detail || errorData.error || 'Failed to send command',
            backendUrl: BACKEND_URL,
          },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Handle network errors specifically
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timeout connecting to backend:', BACKEND_URL)
        return NextResponse.json(
          {
            success: false,
            error: 'Backend server timeout - the server did not respond in time',
            details: `Unable to reach backend at ${BACKEND_URL}. Please ensure the FastAPI backend is running on port 8000.`,
            backendUrl: BACKEND_URL,
          },
          { status: 503 }
        )
      }
      
      // Handle connection refused and other network errors
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        console.error('❌ Connection refused to backend:', BACKEND_URL)
        return NextResponse.json(
          {
            success: false,
            error: 'Backend server not reachable',
            details: `Cannot connect to backend at ${BACKEND_URL}. Please ensure the FastAPI backend is running. Start it with: python -m uvicorn app.main:app --reload --port 8000`,
            backendUrl: BACKEND_URL,
          },
          { status: 503 }
        )
      }
      
      throw fetchError // Re-throw if it's not a network error
    }
  } catch (error) {
    console.error('❌ MQTT control API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send MQTT command',
        details: error instanceof Error ? error.message : 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get MQTT status with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/api/mqtt/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json(
          {
            connected: false,
            error: `Backend returned ${response.status}`,
            backendUrl: BACKEND_URL,
          },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          {
            connected: false,
            error: 'Backend server not reachable',
            details: `Cannot connect to backend at ${BACKEND_URL}. Please ensure the FastAPI backend is running.`,
            backendUrl: BACKEND_URL,
          },
          { status: 503 }
        )
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('❌ MQTT status API error:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    )
  }
}

