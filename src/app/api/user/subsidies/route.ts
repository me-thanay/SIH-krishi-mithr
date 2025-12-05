import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Helper function to get user from token
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any
    return decoded.userId
  } catch (error) {
    return null
  }
}

// GET /api/user/subsidies - Get subsidies relevant to user's profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's agricultural profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agriculturalProfile: true
      }
    })

    if (!user || !user.agriculturalProfile) {
      return NextResponse.json(
        { error: 'Agricultural profile not found' },
        { status: 404 }
      )
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

    return NextResponse.json({
      success: true,
      data: eligibleSubsidies,
      message: 'Subsidies filtered based on your profile'
    })

  } catch (error) {
    console.error('Get user subsidies error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
