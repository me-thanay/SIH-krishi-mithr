import { NextRequest, NextResponse } from 'next/server'

/**
 * Send WhatsApp message via backend
 * POST /api/whatsapp/send
 * Body: { message: string } OR { phoneNumber: string, message: string } (legacy)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Support both new format { message: string } and legacy format { phoneNumber, message }
    let message: string
    if (body.message !== undefined) {
      // New format: just message (backend adds "kissan" prefix)
      message = body.message
    } else if (body.phoneNumber && body.message) {
      // Legacy format: phoneNumber + message
      message = body.message
    } else {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get backend URL
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

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { detail: errorText }
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorData.detail || errorData.error || 'Unknown error',
          code: errorData.code
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[WHATSAPP PROXY] Backend response:', data)

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

