import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

export type LocalUser = {
  id: string
  email: null
  name: string
  phone: string
  password: null
  faceImage: string
  createdAt: string
  updatedAt: string
  agriculturalProfile: null
}

type StoreFile = {
  users: LocalUser[]
}

const storePath = path.join(process.cwd(), 'data', 'local-users.json')

function emptyStore(): StoreFile {
  return { users: [] }
}

function readStore(): StoreFile {
  try {
    if (!existsSync(storePath)) return emptyStore()
    const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as StoreFile
    return { users: Array.isArray(parsed.users) ? parsed.users : [] }
  } catch {
    return emptyStore()
  }
}

function writeStore(store: StoreFile) {
  mkdirSync(path.dirname(storePath), { recursive: true })
  writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8')
}

export function findLocalUserByPhone(phone: string): LocalUser | null {
  return readStore().users.find((user) => user.phone === phone) || null
}

export function findLocalUserById(id: string): LocalUser | null {
  return readStore().users.find((user) => user.id === id) || null
}

export function createLocalUser(phone: string, faceImage: string): LocalUser {
  const now = new Date().toISOString()
  const user: LocalUser = {
    id: randomUUID(),
    email: null,
    name: `User ${phone.slice(-4)}`,
    phone,
    password: null,
    faceImage,
    createdAt: now,
    updatedAt: now,
    agriculturalProfile: null,
  }

  const store = readStore()
  store.users.push(user)
  writeStore(store)
  return user
}
