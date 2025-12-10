import { NextRequest, NextResponse } from 'next/server'

/**
 * Send WhatsApp message using WhatsApp Business API
 * POST /api/whatsapp/send
 * Body: { phoneNumber: string, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, message } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Get WhatsApp API credentials from environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error('[WHATSAPP] Missing WhatsApp API credentials')
      return NextResponse.json(
        { 
          error: 'WhatsApp API not configured',
          message: 'Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables'
        },
        { status: 500 }
      )
    }

    // Format phone number (remove +, spaces, and ensure it starts with country code)
    let formattedPhone = phoneNumber.replace(/[\s\+\-]/g, '')
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone
    }

    // WhatsApp Business API endpoint
    const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

    // Send message via WhatsApp Business API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[WHATSAPP] API error:', data)
      return NextResponse.json(
        { 
          error: 'Failed to send WhatsApp message',
          details: data.error?.message || 'Unknown error',
          code: data.error?.code
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: data.messages?.[0]?.id
    })

  } catch (error: any) {
    console.error('[WHATSAPP] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send WhatsApp message',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

