import type { NextApiRequest, NextApiResponse } from 'next'
import { loginWithPhoneAndFace } from '../../../src/lib/phone-face-auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { phone, faceImage } = req.body || {}
    const result = await loginWithPhoneAndFace(phone, faceImage)
    return res.status(result.status).json(result.body)
  } catch (error: any) {
    console.error('[LOGIN ERROR]', error)
    const message = String(error?.message || '')
    if (message.includes('must start with the protocol `mongo`') || message.includes('Invalid scheme')) {
      return res.status(500).json({
        success: false,
        error: 'Database is not configured. DATABASE_URL must start with mongodb:// or mongodb+srv://. Restart the server after updating .env.',
      })
    }
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error',
    })
  }
}
