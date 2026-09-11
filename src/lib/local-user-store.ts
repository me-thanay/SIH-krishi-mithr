import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
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

const memoryStore: StoreFile = { users: [] }
let memoryLoaded = false

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY)
}

function getStorePath() {
  const directory = isServerless()
    ? tmpdir()
    : path.join(process.cwd(), 'data')
  return path.join(directory, 'krishi-mithr-users.json')
}

function emptyStore(): StoreFile {
  return { users: [] }
}

function loadStore(): StoreFile {
  if (memoryLoaded) return memoryStore

  memoryLoaded = true
  try {
    const storePath = getStorePath()
    if (!existsSync(storePath)) return memoryStore
    const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as StoreFile
    memoryStore.users = Array.isArray(parsed.users) ? parsed.users : []
  } catch {
    memoryStore.users = emptyStore().users
  }

  return memoryStore
}

function persistStore() {
  try {
    const storePath = getStorePath()
    mkdirSync(path.dirname(storePath), { recursive: true })
    writeFileSync(storePath, JSON.stringify(memoryStore), 'utf8')
  } catch (error) {
    console.warn('[auth] Could not persist local users to disk; keeping them in memory', error)
  }
}

export function findLocalUserByPhone(phone: string): LocalUser | null {
  return loadStore().users.find((user) => user.phone === phone) || null
}

export function findLocalUserById(id: string): LocalUser | null {
  return loadStore().users.find((user) => user.id === id) || null
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

  const store = loadStore()
  store.users.push(user)
  persistStore()
  return user
}
