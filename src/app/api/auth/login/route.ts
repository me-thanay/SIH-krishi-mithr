import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateToken, createAuthResponse, isValidEmail, isValidPhone } from '@/lib/auth'

// Simple face image comparison function
// In production, use a proper face recognition library or service
function compareFaceImages(image1: string, image2: string): boolean {
  // Extract base64 data (remove data:image/jpeg;base64, prefix)
  const base64Image1 = image1.split(',')[1] || image1
  const base64Image2 = image2.split(',')[1] || image2
  
  // Simple comparison: check if images are similar in size and structure
  // This is a basic implementation - for production, use proper face recognition
  if (!base64Image1 || !base64Image2) {
    return false
  }
  
  // Calculate similarity based on base64 string length and structure
  // In a real implementation, you would:
  // 1. Decode images to pixel data
  // 2. Extract face features/embeddings
  // 3. Compare feature vectors using cosine similarity or Euclidean distance
  // 4. Use a threshold (e.g., 0.6-0.8) to determine if faces match
  
  // For now, we'll do a simple check - in production, integrate with:
  // - face-api.js (client-side)
  // - AWS Rekognition
  // - Google Cloud Vision API
  // - Azure Face API
  // - Or a custom ML model
  
  // Basic validation: check if both images are valid base64
  try {
    const buffer1 = Buffer.from(base64Image1, 'base64')
    const buffer2 = Buffer.from(base64Image2, 'base64')
    
    // Simple heuristic: if images are similar in size (within 20% difference)
    // and both are valid images, consider them potentially matching
    // NOTE: This is a placeholder - implement proper face recognition
    const sizeDiff = Math.abs(buffer1.length - buffer2.length) / Math.max(buffer1.length, buffer2.length)
    
    // For demo purposes, we'll accept if images are reasonably similar in size
    // In production, replace this with actual face recognition
    return sizeDiff < 0.3 // 30% size difference threshold (very lenient for demo)
  } catch (error) {
    console.error('Face comparison error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, phone, faceImage, loginMethod } = body

    // Handle face recognition login
    if (loginMethod === 'face' || faceImage) {
      if (!phone || !faceImage) {
        return NextResponse.json(
          { error: 'Phone number and face image are required for face login' },
          { status: 400 }
        )
      }

      // Validate phone number
      if (!isValidPhone(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }

      // Find user by phone (using findFirst since phone may not be unique in DB)
      const user = await prisma.user.findFirst({
        where: { phone },
        include: {
          agriculturalProfile: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this phone number' },
          { status: 401 }
        )
      }

      // Check if user has a stored face image
      if (!user.faceImage) {
        return NextResponse.json(
          { error: 'Face verification not set up. Please use phone-only login or contact support.' },
          { status: 401 }
        )
      }

      // Compare faces
      const facesMatch = compareFaceImages(faceImage, user.faceImage)

      if (!facesMatch) {
        return NextResponse.json(
          { error: 'Face verification failed. Please try again or use phone-only login.' },
          { status: 401 }
        )
      }

      // Faces match - create token
      const token = generateToken(user.id, user.phone || user.email || user.id)
      const { password: _, faceImage: __, ...userWithoutSensitiveData } = user

      return NextResponse.json(createAuthResponse(
        true,
        userWithoutSensitiveData,
        token,
        'Face verification successful'
      ))
    }

    // Handle phone-only login
    if (loginMethod === 'phone' && phone) {
      if (!phone) {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        )
      }

      // Validate phone number
      if (!isValidPhone(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }

      // Find user by phone (using findFirst since phone may not be unique in DB)
      const user = await prisma.user.findFirst({
        where: { phone },
        include: {
          agriculturalProfile: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this phone number' },
          { status: 401 }
        )
      }

      // Create token for phone-only login
      const token = generateToken(user.id, user.phone || user.email || user.id)
      const { password: _, faceImage: __, ...userWithoutSensitiveData } = user

      return NextResponse.json(createAuthResponse(
        true,
        userWithoutSensitiveData,
        token,
        'Login successful'
      ))
    }

    // Handle traditional email/password login (backward compatibility)
    if (email && password) {
      // Validate email format
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          agriculturalProfile: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      // Check password (if user has one)
      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Password not set. Please use phone or face login.' },
          { status: 401 }
        )
      }

      // Create JWT token
      const token = generateToken(user.id, user.email || user.phone || user.id)
      const { password: _, faceImage: __, ...userWithoutSensitiveData } = user

      return NextResponse.json(createAuthResponse(
        true,
        userWithoutSensitiveData,
        token,
        'Login successful'
      ))
    }

    return NextResponse.json(
      { error: 'Invalid login method. Please provide phone+face, phone only, or email+password.' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

