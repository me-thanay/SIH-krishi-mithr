import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuthResponse {
  success: boolean
  user?: AuthUser
  token?: string
  message?: string
  error?: string
}

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

// Generate JWT token
export function generateToken(userId: string, identifier: string): string {
  return jwt.sign(
    { userId, identifier },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; identifier: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return { userId: decoded.userId, identifier: decoded.identifier || decoded.email }
  } catch (error) {
    return null
  }
}

// Get user from request token
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

// Get user with agricultural profile from request
export async function getUserWithProfileFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        agriculturalProfile: true,
        userCrops: {
          include: {
            crop: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (user && user.agriculturalProfile) {
      // Parse JSON fields
      user.agriculturalProfile.crops = JSON.parse(user.agriculturalProfile.crops || '[]')
      user.agriculturalProfile.governmentSchemes = JSON.parse(user.agriculturalProfile.governmentSchemes || '[]')
    }

    return user
  } catch (error) {
    console.error('Error fetching user with profile:', error)
    return null
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (password.length > 100) {
    return { valid: false, message: 'Password must be less than 100 characters' }
  }

  return { valid: true }
}

// Validate phone number format (Indian format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

// Create authentication response
export function createAuthResponse(
  success: boolean,
  user?: AuthUser,
  token?: string,
  message?: string,
  error?: string
): AuthResponse {
  return {
    success,
    user,
    token,
    message,
    error
  }
}

// Middleware to check authentication
export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, user)
  }
}
