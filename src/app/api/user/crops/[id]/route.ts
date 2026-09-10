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

// GET /api/user/crops/[id] - Get specific user crop
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userCrop = await prisma.userCrop.findFirst({
      where: {
        id: params.id,
        userId
      },
      include: {
        crop: true
      }
    })

    if (!userCrop) {
      return NextResponse.json(
        { error: 'User crop not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userCrop
    })

  } catch (error) {
    console.error('Get user crop error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/user/crops/[id] - Update user crop
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { plantedDate, harvestDate, quantity, status, notes } = body

    const userCrop = await prisma.userCrop.updateMany({
      where: {
        id: params.id,
        userId
      },
      data: {
        plantedDate: plantedDate ? new Date(plantedDate) : undefined,
        harvestDate: harvestDate ? new Date(harvestDate) : undefined,
        quantity,
        status,
        notes
      }
    })

    if (userCrop.count === 0) {
      return NextResponse.json(
        { error: 'User crop not found' },
        { status: 404 }
      )
    }

    const updatedUserCrop = await prisma.userCrop.findFirst({
      where: {
        id: params.id,
        userId
      },
      include: {
        crop: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUserCrop,
      message: 'User crop updated successfully'
    })

  } catch (error) {
    console.error('Update user crop error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/crops/[id] - Remove user crop
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserFromToken(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userCrop = await prisma.userCrop.deleteMany({
      where: {
        id: params.id,
        userId
      }
    })

    if (userCrop.count === 0) {
      return NextResponse.json(
        { error: 'User crop not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User crop removed successfully'
    })

  } catch (error) {
    console.error('Delete user crop error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
