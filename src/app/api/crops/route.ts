import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/crops - Get all crops with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const season = searchParams.get('season')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true
    }

    if (category) {
      where.category = category
    }

    if (season) {
      where.season = season
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { scientificName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [crops, total] = await Promise.all([
      prisma.crop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.crop.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: crops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get crops error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/crops - Create a new crop (admin only)
export async function POST(request: NextRequest) {
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
      imageUrl
    } = body

    // Validate required fields
    if (!name || !category || !season || !duration || !waterRequirement || !soilType || !climate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const crop = await prisma.crop.create({
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
        imageUrl
      }
    })

    return NextResponse.json({
      success: true,
      data: crop,
      message: 'Crop created successfully'
    })

  } catch (error: any) {
    console.error('Create crop error:', error)
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
