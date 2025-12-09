import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import jwt from 'jsonwebtoken'

// Helper functions
function generateToken(userId: string, identifier: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'fallback-secret-key') {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    { userId, identifier },
    secret,
    { expiresIn: '7d' }
  )
}

function createAuthResponse(success: boolean, user?: any, token?: string, message?: string) {
  return { success, user, token, message }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  // Check for required environment variables
  const databaseUrl = process.env.DATABASE_URL
  const jwtSecret = process.env.JWT_SECRET
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set')
    return res.status(500).json({ 
      error: 'Server configuration error: DATABASE_URL missing',
      debug: {
        hasDatabaseUrl: !!databaseUrl,
        nodeEnv: process.env.NODE_ENV
      }
    })
  }
  
  if (!jwtSecret || jwtSecret === 'fallback-secret-key') {
    console.error('JWT_SECRET is not set or using fallback')
    return res.status(500).json({ 
      error: 'Server configuration error: JWT_SECRET missing',
      debug: {
        hasJwtSecret: !!jwtSecret,
        isFallback: jwtSecret === 'fallback-secret-key'
      }
    })
  }
  
  try {
    const { phone, faceImage } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' })
    }

    if (!faceImage) {
      return res.status(400).json({ error: 'Face photo is required' })
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' })
    }

    // Find user by phone
    let user
    try {
      user = await prisma.user.findFirst({
        where: { phone },
        include: {
          agriculturalProfile: true
        }
      })
    } catch (dbError: any) {
      console.error('Database query error:', dbError)
      throw new Error(`Database query failed: ${dbError.message}`)
    }

    if (!user) {
      return res.status(401).json({ error: 'No account found with this phone number' })
    }

    // Update user's face image with the new photo (replace old one)
    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { faceImage },
        include: {
          agriculturalProfile: true
        }
      })
    } catch (updateError: any) {
      console.error('Database update error:', updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    // Create token
    const token = generateToken(updatedUser.id, updatedUser.phone || updatedUser.id)
    const { password: _, faceImage: __, email: ___, name: ____, ...userWithoutSensitiveData } = updatedUser

    return res.status(200).json(createAuthResponse(
      true,
      userWithoutSensitiveData,
      token,
      'Login successful'
    ))

  } catch (error: any) {
    console.error('Login error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error code:', error.code)
    console.error('Error name:', error.name)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Database constraint violation' })
    }
    
    // Prisma connection errors
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database server')) {
      return res.status(500).json({ 
        error: 'Database connection failed',
        message: 'Unable to connect to database. Please check DATABASE_URL configuration.'
      })
    }
    
    if (error.code === 'P1017' || error.message?.includes('Connection closed')) {
      return res.status(500).json({ 
        error: 'Database connection closed',
        message: 'Database connection was closed unexpectedly.'
      })
    }
    
    // P2010: Raw query execution error (often MongoDB connection or schema mismatch)
    if (error.code === 'P2010') {
      return res.status(500).json({ 
        error: 'Database query execution failed',
        message: 'Prisma query execution error. This usually means: 1) DATABASE_URL is incorrect, 2) MongoDB connection failed, 3) Prisma client needs regeneration, or 4) Schema mismatch with database.'
      })
    }
    
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('PrismaClient') || error.message?.includes('Prisma')) {
      return res.status(500).json({ 
        error: 'Database configuration error',
        message: 'Database connection is not properly configured. Please check environment variables.'
      })
    }
    
    // JWT errors
    if (error.message?.includes('JWT_SECRET')) {
      return res.status(500).json({ 
        error: 'JWT configuration error',
        message: 'JWT_SECRET is not properly configured.'
      })
    }
    
    // Return error with message for debugging
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN'
    })
  }
}
