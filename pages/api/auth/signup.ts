import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../src/lib/prisma'
import jwt from 'jsonwebtoken'

// Phone validation removed - now accepts any 10-digit number

function createAuthResponse(success: boolean, user?: any, token?: string, message?: string) {
  return { success, user, token, message }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const { phone, faceImage, agriculturalProfile } = req.body

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' })
    }

    if (!faceImage) {
      return res.status(400).json({ error: 'Face photo is required' })
    }

    // Validate phone format (10 digits, can start with any digit)
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be 10 digits' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this phone' })
    }

    // Create user with face image (agricultural profile is optional)
    const user = await prisma.user.create({
      data: {
        phone: cleanPhone,
        faceImage: faceImage,
        agriculturalProfile: agriculturalProfile ? {
          create: {
            farmSize: agriculturalProfile.farmSize || agriculturalProfile.landArea || '',
            landArea: agriculturalProfile.landArea || agriculturalProfile.farmSize || '',
            crops: JSON.stringify(agriculturalProfile.crops || []),
            location: agriculturalProfile.location || '',
            state: agriculturalProfile.state || '',
            district: agriculturalProfile.district || null,
            soilType: agriculturalProfile.soilType || '',
            irrigationType: agriculturalProfile.irrigationType || '',
            farmingExperience: agriculturalProfile.farmingExperience || '',
            annualIncome: agriculturalProfile.annualIncome || '',
            governmentSchemes: JSON.stringify(agriculturalProfile.governmentSchemes || [])
          }
        } : undefined
      },
      include: {
        agriculturalProfile: true
      }
    })

    const userWithoutSensitive = {
      ...user,
      password: undefined,
      faceImage: undefined,
      email: undefined,
      name: undefined,
    }

    return res.status(200).json(createAuthResponse(
      true,
      userWithoutSensitive,
      undefined,
      'User created successfully'
    ))

  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
