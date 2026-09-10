import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuthResponse, isValidPhone } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, faceImage } = body

    // Validate required fields
    if (!phone || !faceImage) {
      return NextResponse.json(
        { error: 'Phone number and face image are required' },
        { status: 400 }
      )
    }

    // Validate phone number format (10 digits)
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Please enter a 10-digit phone number.' },
        { status: 400 }
      )
    }

    // Check if user already exists by phone
    const existingUser = await prisma.user.findFirst({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this phone number' },
        { status: 400 }
      )
    }

    // Create user with phone and face image only
    const user = await prisma.user.create({
      data: {
        phone,
        faceImage: faceImage,
        name: `User ${phone.slice(-4)}`, // Default name from phone number
      },
      include: {
        agriculturalProfile: true
      }
    })

    // Remove sensitive fields from response
    const { faceImage: _, ...userWithoutSensitiveData } = user

    return NextResponse.json(createAuthResponse(
      true,
      userWithoutSensitiveData,
      undefined,
      'Farmer account created successfully'
    ))

  } catch (error: any) {
    console.error('Signup error:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Phone number or Aadhar number already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

