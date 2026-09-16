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
  faceImage: string | null
  createdAt: string
  updatedAt: string
  agriculturalProfile: null
}

export type LocalWebAuthnCredential = {
  id: string
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  deviceType?: string | null
  backedUp?: boolean
  transports?: string | null
  createdAt: string
}

type StoreFile = {
  users: LocalUser[]
  credentials: LocalWebAuthnCredential[]
}

const memoryStore: StoreFile = { users: [], credentials: [] }
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
  return { users: [], credentials: [] }
}

function loadStore(): StoreFile {
  if (memoryLoaded) return memoryStore

  memoryLoaded = true
  try {
    const storePath = getStorePath()
    if (!existsSync(storePath)) return memoryStore
    const parsed = JSON.parse(readFileSync(storePath, 'utf8')) as StoreFile
    memoryStore.users = Array.isArray(parsed.users) ? parsed.users : []
    memoryStore.credentials = Array.isArray(parsed.credentials) ? parsed.credentials : []
  } catch {
    memoryStore.users = emptyStore().users
    memoryStore.credentials = emptyStore().credentials
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

export function createLocalUser(phone: string, faceImage?: string | null): LocalUser {
  const now = new Date().toISOString()
  const user: LocalUser = {
    id: randomUUID(),
    email: null,
    name: `User ${phone.slice(-4)}`,
    phone,
    password: null,
    faceImage: faceImage || null,
    createdAt: now,
    updatedAt: now,
    agriculturalProfile: null,
  }

  const store = loadStore()
  store.users.push(user)
  persistStore()
  return user
}

export function findLocalCredentialsByUserId(userId: string): LocalWebAuthnCredential[] {
  return loadStore().credentials.filter((credential) => credential.userId === userId)
}

export function findLocalCredentialById(credentialId: string): LocalWebAuthnCredential | null {
  return loadStore().credentials.find((credential) => credential.credentialId === credentialId) || null
}

export function saveLocalCredential(credential: Omit<LocalWebAuthnCredential, 'id' | 'createdAt'>): LocalWebAuthnCredential {
  const stored: LocalWebAuthnCredential = {
    ...credential,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const store = loadStore()
  store.credentials.push(stored)
  persistStore()
  return stored
}

export function updateLocalCredentialCounter(credentialId: string, counter: number) {
  const store = loadStore()
  const credential = store.credentials.find((item) => item.credentialId === credentialId)
  if (credential) {
    credential.counter = counter
    persistStore()
  }
}
