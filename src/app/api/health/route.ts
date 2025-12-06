import { NextRequest, NextResponse } from 'next/server'

/**
 * Health check endpoint to diagnose configuration issues
 * GET /api/health
 */
export async function GET(request: NextRequest) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'not set',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'fallback-secret-key',
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) || 'not set',
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
    },
    routes: {
      appRouter: {
        login: '/api/auth/login (App Router)',
        signup: '/api/auth/signup (App Router)',
        profile: '/api/auth/profile (App Router)',
      },
      pagesRouter: {
        login: '/api/auth/login (Pages Router - deprecated)',
        note: 'App Router takes precedence in Next.js 13+',
      },
    },
  }

  // Test database connection if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$connect()
      health.environment.databaseConnection = 'connected'
      await prisma.$disconnect()
    } catch (error: any) {
      health.environment.databaseConnection = 'failed'
      health.environment.databaseError = {
        code: error.code,
        message: error.message?.substring(0, 100),
      }
      health.status = 'error'
    }
  } else {
    health.environment.databaseConnection = 'not configured'
    health.status = 'warning'
  }

  const statusCode = health.status === 'ok' ? 200 : health.status === 'warning' ? 200 : 500

  return NextResponse.json(health, { status: statusCode })
}

