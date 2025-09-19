import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('WhatsApp webhook received:', {
      from: body.from,
      body: body.body,
      timestamp: body.timestamp,
      type: body.type,
      isGroup: body.isGroup
    })

    // Process the WhatsApp message
    const { from, body: messageBody, timestamp, type, isGroup } = body

    // Store message in database or process it
    // You can add database operations here
    
    // Log the message for debugging
    console.log(`[WEBHOOK] ${from}: ${messageBody}`)

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp message received',
      data: {
        from,
        body: messageBody,
        timestamp,
        type,
        isGroup
      }
    })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process WhatsApp message' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'WhatsApp webhook endpoint is active',
    status: 'ready'
  })
}
