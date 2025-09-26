import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any

    const body = await request.json()
    const { location, queryType, response } = body

    // Store weather query
    const weatherQuery = await prisma.weatherQuery.create({
      data: {
        userId: decoded.userId,
        location,
        queryType,
        response: JSON.stringify(response)
      }
    })

    return NextResponse.json({
      success: true,
      weatherQuery
    })

  } catch (error) {
    console.error('Weather query error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

