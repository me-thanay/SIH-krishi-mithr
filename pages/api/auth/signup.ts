import { NextApiRequest, NextApiResponse } from 'next'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Auth disabled
  return res.status(410).json({ error: 'Signup is disabled' })
}
