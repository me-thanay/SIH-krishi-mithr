import { NextRequest, NextResponse } from 'next/server'
import { getUserWithProfileFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithProfileFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get additional user data
    const userWithQueries = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!userWithQueries) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields in agricultural profile
    if (userWithQueries.agriculturalProfile) {
      userWithQueries.agriculturalProfile.crops = JSON.parse(userWithQueries.agriculturalProfile.crops || '[]')
      userWithQueries.agriculturalProfile.governmentSchemes = JSON.parse(userWithQueries.agriculturalProfile.governmentSchemes || '[]')
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userWithQueries

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

