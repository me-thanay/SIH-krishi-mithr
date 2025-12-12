import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint to send WhatsApp message via backend
 * POST /api/send-whatsapp
 * Body: { message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (message === undefined) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get backend URL from environment or use production URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://sih-krishi-mithr-api.onrender.com'
    const apiUrl = `${backendUrl}/api/webhook/send-whatsapp`

    console.log('[WHATSAPP PROXY] Sending to backend:', apiUrl)
    console.log('[WHATSAPP PROXY] Message:', message)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message || '' }),
    })

    const data = await response.json()
    console.log('[WHATSAPP PROXY] Backend response:', data)

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.detail || data.error || 'Unknown error',
          code: data.code
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: data.message_id,
      sentTo: data.sent_to,
      messageText: data.message_text
    })

  } catch (error: any) {
    console.error('[WHATSAPP PROXY] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send WhatsApp message',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}


