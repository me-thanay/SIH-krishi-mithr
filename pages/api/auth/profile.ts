import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { findUserById, toPublicUser } from '../../../src/lib/user-repository'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as { userId?: string }

    if (!decoded?.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await findUserById(decoded.userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      success: true,
      user: toPublicUser(user),
    })
  } catch (error) {
    console.error('Profile error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
