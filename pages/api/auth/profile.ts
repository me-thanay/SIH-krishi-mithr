import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'

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
    
    // Verify JWT token
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
    
    // Get user with agricultural profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        agriculturalProfile: true,
        weatherQueries: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        marketQueries: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        userCrops: {
          include: {
            crop: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Parse JSON fields in agricultural profile
    if (user.agriculturalProfile) {
      user.agriculturalProfile.crops = JSON.parse(user.agriculturalProfile.crops || '[]')
      user.agriculturalProfile.governmentSchemes = JSON.parse(user.agriculturalProfile.governmentSchemes || '[]')
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return res.status(200).json({
      success: true,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Profile error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
