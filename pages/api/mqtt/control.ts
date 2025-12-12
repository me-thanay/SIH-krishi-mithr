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
      return res.status(response.status).json({
        success: false,
        error: data.detail || data.error || 'Failed to send command',
      })
    }

    return res.status(200).json(data)
  } catch (error: any) {
    console.error('MQTT control API (pages) error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to send MQTT command',
      details: error?.message || 'Unknown error',
    })
  }
}



