import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/subsidies - Get all subsidies with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const state = searchParams.get('state')
    const district = searchParams.get('district')
    const cropType = searchParams.get('cropType')
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

    if (state) {
      where.state = state
    }

    if (district) {
      where.district = district
    }

    if (cropType) {
      where.cropType = cropType
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [subsidies, total] = await Promise.all([
      prisma.subsidy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subsidy.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: subsidies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get subsidies error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/subsidies - Create a new subsidy (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      eligibility,
      amount,
      category,
      state,
      district,
      cropType,
      minFarmSize,
      maxFarmSize,
      validFrom,
      validTo
    } = body

    // Validate required fields
    if (!name || !description || !eligibility || !amount || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const subsidy = await prisma.subsidy.create({
      data: {
        name,
        description,
        eligibility,
        amount,
        category,
        state,
        district,
        cropType,
        minFarmSize,
        maxFarmSize,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null
      }
    })

    return NextResponse.json({
      success: true,
      data: subsidy,
      message: 'Subsidy created successfully'
    })

  } catch (error) {
    console.error('Create subsidy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}