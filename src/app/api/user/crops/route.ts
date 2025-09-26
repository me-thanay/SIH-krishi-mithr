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

// GET /api/user/crops - Get user's crops
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { userId }
    if (status) {
      where.status = status
    }

    const userCrops = await prisma.userCrop.findMany({
      where,
      include: {
        crop: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: userCrops
    })

  } catch (error) {
    console.error('Get user crops error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/user/crops - Add a crop to user's farm
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cropId, plantedDate, quantity, notes } = body

    // Validate required fields
    if (!cropId) {
      return NextResponse.json(
        { error: 'Crop ID is required' },
        { status: 400 }
      )
    }

    // Check if crop exists
    const crop = await prisma.crop.findUnique({
      where: { id: cropId }
    })

    if (!crop) {
      return NextResponse.json(
        { error: 'Crop not found' },
        { status: 404 }
      )
    }

    // Check if user already has this crop
    const existingUserCrop = await prisma.userCrop.findUnique({
      where: {
        userId_cropId: {
          userId,
          cropId
        }
      }
    })

    if (existingUserCrop) {
      return NextResponse.json(
        { error: 'You already have this crop in your farm' },
        { status: 400 }
      )
    }

    const userCrop = await prisma.userCrop.create({
      data: {
        userId,
        cropId,
        plantedDate: plantedDate ? new Date(plantedDate) : null,
        quantity,
        status: 'planted',
        notes
      },
      include: {
        crop: true
      }
    })

    return NextResponse.json({
      success: true,
      data: userCrop,
      message: 'Crop added to your farm successfully'
    })

  } catch (error) {
    console.error('Add user crop error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
