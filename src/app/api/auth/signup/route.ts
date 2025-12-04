import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuthResponse, isValidPhone } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      phone, 
      aadharNumber, 
      aadharName, 
      aadharDob, 
      aadharAddress, 
      faceImage, 
      landArea 
    } = body

    // Validate required fields
    if (!phone || !aadharNumber || !aadharName || !aadharDob || !aadharAddress || !landArea) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate Aadhar number format (12 digits)
    const aadharRegex = /^\d{12}$/
    const cleanAadhar = aadharNumber.replace(/\s/g, '')
    if (!aadharRegex.test(cleanAadhar)) {
      return NextResponse.json(
        { error: 'Invalid Aadhar number format. Please enter a 12-digit Aadhar number.' },
        { status: 400 }
      )
    }

    // Validate date of birth
    const dob = new Date(aadharDob)
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 }
      )
    }

    // Check if user already exists by phone (using findFirst since phone may not be unique in DB yet)
    const existingUserByPhone = await prisma.user.findFirst({
      where: { phone }
    })

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'User already exists with this phone number' },
        { status: 400 }
      )
    }

    // Check if Aadhar number is already registered
    const existingUserByAadhar = await prisma.user.findFirst({
      where: { aadharNumber: cleanAadhar }
    })

    if (existingUserByAadhar) {
      return NextResponse.json(
        { error: 'Aadhar number is already registered' },
        { status: 400 }
      )
    }

    // Create user with Aadhar details and agricultural profile
    const user = await prisma.user.create({
      data: {
        phone,
        aadharNumber: cleanAadhar,
        aadharName,
        aadharDob: dob,
        aadharAddress,
        faceImage: faceImage || null,
        name: aadharName, // Use Aadhar name as user name
        agriculturalProfile: {
          create: {
            landArea,
            farmSize: landArea // Keep for backward compatibility
          }
        }
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

