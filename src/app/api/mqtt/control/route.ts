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

    // Forward to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/mqtt/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.detail || 'Failed to send command' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('MQTT control API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send MQTT command',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get MQTT status
    const response = await fetch(`${BACKEND_URL}/api/mqtt/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('MQTT status API error:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

