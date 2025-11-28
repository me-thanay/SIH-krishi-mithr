import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Helper functions
function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret === 'fallback-secret-key') {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '7d' }
  )
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function createAuthResponse(success: boolean, user?: any, token?: string, message?: string) {
  return { success, user, token, message }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        agriculturalProfile: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Create JWT token
    const token = generateToken(user.id, user.email)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return res.status(200).json(createAuthResponse(
      true,
      userWithoutPassword,
      token,
      'Login successful'
    ))

  } catch (error: any) {
    console.error('Login error:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Database constraint violation' })
    }
    
    if (error.message?.includes('DATABASE_URL') || error.message?.includes('PrismaClient')) {
      return res.status(500).json({ 
        error: 'Database connection error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
