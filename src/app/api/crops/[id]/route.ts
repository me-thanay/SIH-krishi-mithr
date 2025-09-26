import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/crops/[id] - Get a specific crop
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const crop = await prisma.crop.findUnique({
      where: { id: params.id }
    })

    if (!crop) {
      return NextResponse.json(
        { error: 'Crop not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: crop
    })

  } catch (error) {
    console.error('Get crop error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/crops/[id] - Update a specific crop (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      scientificName,
      category,
      season,
      duration,
      waterRequirement,
      soilType,
      climate,
      yieldPerAcre,
      marketPrice,
      description,
      imageUrl,
      isActive
    } = body

    const crop = await prisma.crop.update({
      where: { id: params.id },
      data: {
        name,
        scientificName,
        category,
        season,
        duration,
        waterRequirement,
        soilType,
        climate,
        yieldPerAcre,
        marketPrice,
        description,
        imageUrl,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: crop,
      message: 'Crop updated successfully'
    })

  } catch (error: any) {
    console.error('Update crop error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Crop not found' },
        { status: 404 }
      )
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Crop with this name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/crops/[id] - Delete a specific crop (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.crop.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Crop deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete crop error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Crop not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
