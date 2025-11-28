import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }
  
  if (password.length > 100) {
    return { valid: false, message: 'Password must be less than 100 characters' }
  }

  return { valid: true }
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

function createAuthResponse(success: boolean, user?: any, token?: string, message?: string) {
  return { success, user, token, message }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { email, password, name, phone, agriculturalProfile } = req.body

    // Validate required fields
    if (!email || !password || !name || !agriculturalProfile) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate password strength
    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message })
    }

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
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

    return res.status(200).json(createAuthResponse(
      true,
      userWithoutPassword,
      undefined,
      'User created successfully'
    ))

  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
