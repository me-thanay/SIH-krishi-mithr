import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body || {}
    
    // Support both new format { message: string } and legacy format { phoneNumber, message }
    let message: string
    if (body.message !== undefined) {
      // New format: just message (backend adds "kissan" prefix)
      message = body.message
    } else if (body.phoneNumber && body.message) {
      // Legacy format: phoneNumber + message
      message = body.message
    } else {
      return res.status(400).json({ error: 'Message is required' })
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
      
      return res.status(response.status).json({
        success: false,
        error: errorData.detail || errorData.error || 'Unknown error',
        code: errorData.code
      })
    }

    const data = await response.json()
    console.log('[WHATSAPP PROXY] Backend response:', data)

    return res.status(200).json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: data.message_id,
      sentTo: data.sent_to,
      messageText: data.message_text
    })
  } catch (error: any) {
    console.error('[WHATSAPP PROXY] Error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
      details: error?.message || 'Unknown error'
    })
  }
}
