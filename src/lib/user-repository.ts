import { prisma } from '@/lib/prisma'
import {
  createLocalUser,
  findLocalUserById,
  findLocalUserByPhone,
  type LocalUser,
} from '@/lib/local-user-store'

type AuthUserRecord = {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  password?: string | null
  faceImage?: string | null
  createdAt: Date | string
  updatedAt?: Date | string
  agriculturalProfile?: unknown
}

function isMongoUrl(url?: string) {
  return Boolean(url && (url.startsWith('mongodb://') || url.startsWith('mongodb+srv://')))
}

async function withMongo<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!isMongoUrl(process.env.DATABASE_URL)) return null
  try {
    return await fn()
  } catch (error) {
    console.warn('[auth] MongoDB unavailable, using local user store')
    console.warn(error)
    return null
  }
}

export async function findUserByPhone(phone: string): Promise<AuthUserRecord | null> {
  const mongoUser = await withMongo(() =>
    prisma.user.findFirst({
      where: { phone },
      include: { agriculturalProfile: true },
    })
  )
  if (mongoUser) return mongoUser
  return findLocalUserByPhone(phone)
}

export async function findUserById(id: string): Promise<AuthUserRecord | null> {
  const mongoUser = await withMongo(() =>
    prisma.user.findUnique({
      where: { id },
      include: { agriculturalProfile: true },
    })
  )
  if (mongoUser) return mongoUser
  return findLocalUserById(id)
}

export async function createUserWithPhoneAndFace(
  phone: string,
  faceImage: string
): Promise<AuthUserRecord> {
  const created = await withMongo(() =>
    prisma.user.create({
      data: {
        phone,
        faceImage,
        name: `User ${phone.slice(-4)}`,
      },
      include: { agriculturalProfile: true },
    })
  )
  if (created) return created
  return createLocalUser(phone, faceImage)
}

export function toPublicUser(user: AuthUserRecord | LocalUser) {
  const { password: _password, faceImage: _face, ...safeUser } = user as AuthUserRecord
  return safeUser
}
