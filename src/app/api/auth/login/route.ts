import { NextRequest, NextResponse } from 'next/server'
import { loginWithPhoneAndFace } from '@/lib/phone-face-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await loginWithPhoneAndFace(body.phone, body.faceImage)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error: any) {
    console.error('[LOGIN ERROR]', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
