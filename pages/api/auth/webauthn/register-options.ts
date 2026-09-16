import type { NextApiRequest, NextApiResponse } from 'next'
import { webauthnRegisterOptions } from '../../../../src/lib/webauthn-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const result = await webauthnRegisterOptions(req.headers, req.body?.phone)
    if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie)
    return res.status(result.status).json(result.body)
  } catch (error: any) {
    console.error('[WEBAUTHN REGISTER OPTIONS]', error)
    return res.status(500).json({ success: false, error: error?.message || 'Could not start Face ID registration' })
  }
}
