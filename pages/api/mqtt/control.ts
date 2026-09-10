import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { command } = req.body || {}

    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' })
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
        return res.status(response.status).json({
          success: false,
          error: errorData.detail || errorData.error || 'Failed to send command',
          backendUrl: BACKEND_URL,
        })
      }

      const data = await response.json()
      return res.status(200).json(data)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      // Handle network errors specifically
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timeout connecting to backend:', BACKEND_URL)
        return res.status(503).json({
          success: false,
          error: 'Backend server timeout - the server did not respond in time',
          details: `Unable to reach backend at ${BACKEND_URL}. Please ensure the FastAPI backend is running on port 8000.`,
          backendUrl: BACKEND_URL,
        })
      }
      
      // Handle connection refused and other network errors
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        console.error('❌ Connection refused to backend:', BACKEND_URL)
        return res.status(503).json({
          success: false,
          error: 'Backend server not reachable',
          details: `Cannot connect to backend at ${BACKEND_URL}. Please ensure the FastAPI backend is running. Start it with: python -m uvicorn app.main:app --reload --port 8000`,
          backendUrl: BACKEND_URL,
        })
      }
      
      throw fetchError // Re-throw if it's not a network error
    }
  } catch (error: any) {
    console.error('❌ MQTT control API (pages) error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to send MQTT command',
      details: error?.message || 'Unknown error',
      backendUrl: BACKEND_URL,
    })
  }
}



