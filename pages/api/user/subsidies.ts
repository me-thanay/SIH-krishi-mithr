import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db"
    }
  }
})

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
    
    // Get user's agricultural profile
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        agriculturalProfile: true
      }
    })

    if (!user || !user.agriculturalProfile) {
      return res.status(404).json({ error: 'Agricultural profile not found' })
    }

    const profile = user.agriculturalProfile
    const crops = JSON.parse(profile.crops || '[]')

    // Build query for relevant subsidies
    const where: any = {
      isActive: true,
      OR: [
        { state: profile.state },
        { state: null }, // National subsidies
        { district: profile.district },
        { district: null }
      ]
    }

    // Add crop-specific subsidies
    if (crops.length > 0) {
      where.OR.push({
        cropType: {
          in: crops
        }
      })
    }

    const subsidies = await prisma.subsidy.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    // Filter subsidies based on eligibility criteria
    const eligibleSubsidies = subsidies.filter(subsidy => {
      try {
        const eligibility = JSON.parse(subsidy.eligibility)
        
        // Check farm size eligibility
        if (subsidy.minFarmSize && subsidy.maxFarmSize && profile.farmSize) {
          const farmSize = parseFloat(profile.farmSize.split(' ')[0])
          const minSize = parseFloat(subsidy.minFarmSize.split(' ')[0])
          const maxSize = parseFloat(subsidy.maxFarmSize.split(' ')[0])
          
          if (isNaN(farmSize) || farmSize < minSize || farmSize > maxSize) {
            return false
          }
        }

        // Check validity dates
        const now = new Date()
        if (subsidy.validFrom && new Date(subsidy.validFrom) > now) {
          return false
        }
        if (subsidy.validTo && new Date(subsidy.validTo) < now) {
          return false
        }

        return true
      } catch (error) {
        return true // If eligibility parsing fails, include the subsidy
      }
    })

    return res.status(200).json({
      success: true,
      data: eligibleSubsidies,
      message: 'Subsidies filtered based on your profile'
    })

  } catch (error) {
    console.error('Get user subsidies error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
