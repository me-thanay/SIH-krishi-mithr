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

// GET /api/user/profile - Get user's agricultural profile
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agriculturalProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const profile = user.agriculturalProfile
    if (profile) {
      profile.crops = JSON.parse(profile.crops || '[]')
      profile.governmentSchemes = JSON.parse(profile.governmentSchemes || '[]')
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        agriculturalProfile: profile
      }
    })

  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user/profile - Update user's agricultural profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      phone,
      agriculturalProfile
    } = body

    // Update user basic info
    const userUpdateData: any = {}
    if (name) userUpdateData.name = name
    if (phone !== undefined) userUpdateData.phone = phone

    // Update agricultural profile
    let profileUpdateData: any = {}
    if (agriculturalProfile) {
      profileUpdateData = {
        farmSize: agriculturalProfile.farmSize,
        crops: JSON.stringify(agriculturalProfile.crops || []),
        location: agriculturalProfile.location,
        state: agriculturalProfile.state,
        district: agriculturalProfile.district,
        soilType: agriculturalProfile.soilType,
        irrigationType: agriculturalProfile.irrigationType,
        farmingExperience: agriculturalProfile.farmingExperience,
        annualIncome: agriculturalProfile.annualIncome,
        governmentSchemes: JSON.stringify(agriculturalProfile.governmentSchemes || [])
      }
    }

    // Check if profile exists
    const existingProfile = await prisma.agriculturalProfile.findUnique({
      where: { userId }
    })

    let updatedUser
    if (existingProfile) {
      // Update existing profile
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userUpdateData,
          agriculturalProfile: {
            update: profileUpdateData
          }
        },
        include: {
          agriculturalProfile: true
        }
      })
    } else {
      // Create new profile
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userUpdateData,
          agriculturalProfile: {
            create: profileUpdateData
          }
        },
        include: {
          agriculturalProfile: true
        }
      })
    }

    // Parse JSON fields for response
    if (updatedUser.agriculturalProfile) {
      updatedUser.agriculturalProfile.crops = JSON.parse(updatedUser.agriculturalProfile.crops || '[]')
      updatedUser.agriculturalProfile.governmentSchemes = JSON.parse(updatedUser.agriculturalProfile.governmentSchemes || '[]')
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
