import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

type FarmDoc = Record<string, any>
type StoreFile = { profiles: Record<string, FarmDoc> }

const memory: StoreFile = { profiles: {} }
let loaded = false

function isServerless() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY)
}

function storePath() {
  const dir = isServerless() ? tmpdir() : path.join(process.cwd(), 'data')
  return path.join(dir, 'krishi-mithr-farms.json')
}

function readStore(): StoreFile {
  if (loaded) return memory
  loaded = true
  try {
    const file = storePath()
    if (existsSync(file)) {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as StoreFile
      memory.profiles = parsed.profiles || {}
    }
  } catch {
    /* keep memory */
  }
  return memory
}

function writeStore() {
  const file = storePath()
  try {
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(memory, null, 2), 'utf8')
  } catch {
    /* serverless tmp can still hold the in-memory copy for this instance */
  }
}

export function saveLocalFarmProfile(userId: string, doc: FarmDoc) {
  const store = readStore()
  store.profiles[userId] = { ...doc, farmer_id: userId }
  writeStore()
}

export function getLocalFarmProfile(userId: string): FarmDoc | null {
  const store = readStore()
  return store.profiles[userId] || null
}
