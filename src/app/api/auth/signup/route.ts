import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createAuthResponse, isValidEmail, isValidPassword, isValidPhone } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, agriculturalProfile } = body

    // Validate required fields
    if (!email || !password || !name || !agriculturalProfile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with agricultural profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        agriculturalProfile: {
          create: {
            farmSize: agriculturalProfile.farmSize,
            crops: JSON.stringify(agriculturalProfile.crops),
            location: agriculturalProfile.location,
            state: agriculturalProfile.state,
            district: agriculturalProfile.district,
            soilType: agriculturalProfile.soilType,
            irrigationType: agriculturalProfile.irrigationType,
            farmingExperience: agriculturalProfile.farmingExperience,
            annualIncome: agriculturalProfile.annualIncome,
            governmentSchemes: JSON.stringify(agriculturalProfile.governmentSchemes)
          }
        }
      },
      include: {
        agriculturalProfile: true
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(createAuthResponse(
      true,
      userWithoutPassword,
      undefined,
      'User created successfully'
    ))

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

