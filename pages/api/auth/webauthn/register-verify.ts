import type { NextApiRequest, NextApiResponse } from 'next'
import { webauthnRegisterVerify } from '../../../../src/lib/webauthn-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const result = await webauthnRegisterVerify(req.headers, req.headers.cookie, req.body || {})
    if (result.setCookie) res.setHeader('Set-Cookie', result.setCookie)
    return res.status(result.status).json(result.body)
  } catch (error: any) {
    console.error('[WEBAUTHN REGISTER VERIFY]', error)
    return res.status(500).json({ success: false, error: error?.message || 'Could not verify Face ID registration' })
  }
}
