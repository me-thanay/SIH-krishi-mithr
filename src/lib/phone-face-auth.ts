import { generateToken, createAuthResponse, isValidPhone } from '@/lib/auth'
import {
  createUserWithPhoneAndFace,
  findUserByPhone,
  toPublicUser,
} from '@/lib/user-repository'

type AuthResult = {
  status: number
  body: Record<string, unknown>
}

function compareFaceImages(image1: string, image2: string): boolean {
  const base64Image1 = image1.split(',')[1] || image1
  const base64Image2 = image2.split(',')[1] || image2

  if (!base64Image1 || !base64Image2) {
    return false
  }

  try {
    const buffer1 = Buffer.from(base64Image1, 'base64')
    const buffer2 = Buffer.from(base64Image2, 'base64')
    const sizeDiff =
      Math.abs(buffer1.length - buffer2.length) /
      Math.max(buffer1.length, buffer2.length)

    return sizeDiff < 0.3
  } catch (error) {
    console.error('Face comparison error:', error)
    return false
  }
}

export async function loginWithPhoneAndFace(
  phone?: string,
  faceImage?: string
): Promise<AuthResult> {
  if (!phone || !faceImage) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Phone number and face photo are required',
      },
    }
  }

  if (!isValidPhone(phone)) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Enter a valid 10-digit Indian mobile number',
      },
    }
  }

  const user = await findUserByPhone(phone)

  if (!user) {
    return {
      status: 401,
      body: {
        success: false,
        error: 'No account found with this phone number. Please sign up first.',
      },
    }
  }

  if (!user.faceImage) {
    return {
      status: 401,
      body: {
        success: false,
        error: 'Face verification is not set up for this account. Please sign up with a face photo.',
      },
    }
  }

  if (!compareFaceImages(faceImage, user.faceImage)) {
    return {
      status: 401,
      body: {
        success: false,
        error: 'Face verification failed. Please try again.',
      },
    }
  }

  const token = generateToken(user.id, user.phone || user.id)

  return {
    status: 200,
    body: createAuthResponse(
      true,
      toPublicUser(user) as any,
      token,
      'Login successful'
    ),
  }
}

export async function signupWithPhoneAndFace(
  phone?: string,
  faceImage?: string
): Promise<AuthResult> {
  if (!phone || !faceImage) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Phone number and face photo are required',
      },
    }
  }

  if (!isValidPhone(phone)) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Enter a valid 10-digit Indian mobile number',
      },
    }
  }

  const existingUser = await findUserByPhone(phone)

  if (existingUser) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'An account already exists with this phone number. Please sign in.',
      },
    }
  }

  const user = await createUserWithPhoneAndFace(phone, faceImage)
  const token = generateToken(user.id, user.phone || user.id)

  return {
    status: 200,
    body: createAuthResponse(
      true,
      toPublicUser(user) as any,
      token,
      'Account created successfully'
    ),
  }
}
