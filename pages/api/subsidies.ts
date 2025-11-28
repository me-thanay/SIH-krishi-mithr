import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:./dev.db"
    }
  }
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, state, district, cropType, search, page = '1', limit = '20' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: any = {
      isActive: true
    }

    if (category) {
      where.category = category
    }

    if (state) {
      where.state = state
    }

    if (district) {
      where.district = district
    }

    if (cropType) {
      where.cropType = cropType
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [subsidies, total] = await Promise.all([
      prisma.subsidy.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subsidy.count({ where })
    ])

    return res.status(200).json({
      success: true,
      data: subsidies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })

  } catch (error) {
    console.error('Get subsidies error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
