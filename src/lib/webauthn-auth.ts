import type { IncomingHttpHeaders } from 'http'
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import { generateToken, createAuthResponse, isValidPhone } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  createUserWithPhoneAndFace,
  findUserById,
  findUserByPhone,
  toPublicUser,
} from '@/lib/user-repository'
import {
  findLocalCredentialById,
  findLocalCredentialsByUserId,
  saveLocalCredential,
  updateLocalCredentialCounter,
} from '@/lib/local-user-store'

const COOKIE_NAME = 'km_webauthn'
const CHALLENGE_TTL_MS = 5 * 60 * 1000

type ChallengePayload = {
  phone: string
  challenge: string
  type: 'register' | 'login'
  exp: number
}

type StoredCredential = {
  credentialId: string
  userId: string
  publicKey: string
  counter: number
  transports?: string | null
}

function isMongoUrl(url?: string) {
  return Boolean(url && (url.startsWith('mongodb://') || url.startsWith('mongodb+srv://')))
}

async function withMongo<T>(fn: () => Promise<T>): Promise<T | null> {
  if (!isMongoUrl(process.env.DATABASE_URL)) return null
  try {
    return await fn()
  } catch (error) {
    console.warn('[webauthn] MongoDB unavailable, using local credential store')
    console.warn(error)
    return null
  }
}

function headerValue(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name] ?? headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value
}

export function getWebAuthnConfig(headers: IncomingHttpHeaders) {
  const forwardedHost = headerValue(headers, 'x-forwarded-host')
  const host = (forwardedHost || headerValue(headers, 'host') || 'localhost:3000').split(',')[0].trim()
  const hostname = host.split(':')[0]
  const forwardedProto = headerValue(headers, 'x-forwarded-proto')
  const proto = (forwardedProto || (hostname === 'localhost' ? 'http' : 'https')).split(',')[0].trim()

  return {
    rpName: 'Krishi Mithr',
    rpID: process.env.WEBAUTHN_RP_ID || hostname,
    origin: process.env.WEBAUTHN_ORIGIN || `${proto}://${host}`,
  }
}

function encodeCookie(payload: ChallengePayload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

function decodeCookie(value?: string): ChallengePayload | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as ChallengePayload
    if (!parsed.phone || !parsed.challenge || !parsed.type || !parsed.exp) return null
    if (Date.now() > parsed.exp) return null
    return parsed
  } catch {
    return null
  }
}

function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

export function challengeCookie(payload: ChallengePayload, secure: boolean) {
  const value = encodeCookie(payload)
  const flags = [
    `${COOKIE_NAME}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${Math.floor(CHALLENGE_TTL_MS / 1000)}`,
  ]
  if (secure) flags.push('Secure')
  return flags.join('; ')
}

export function clearChallengeCookie(secure: boolean) {
  const flags = [`${COOKIE_NAME}=`, 'HttpOnly', 'Path=/', 'SameSite=Lax', 'Max-Age=0']
  if (secure) flags.push('Secure')
  return flags.join('; ')
}

function readChallenge(cookieHeader: string | undefined) {
  return decodeCookie(readCookie(cookieHeader, COOKIE_NAME))
}

async function listCredentialsForUser(userId: string): Promise<StoredCredential[]> {
  const mongo = await withMongo(() =>
    prisma.webAuthnCredential.findMany({ where: { userId } })
  )
  if (mongo && mongo.length > 0) {
    return mongo.map((item) => ({
      credentialId: item.credentialId,
      userId: item.userId,
      publicKey: item.publicKey,
      counter: item.counter,
      transports: item.transports,
    }))
  }
  const local = findLocalCredentialsByUserId(userId)
  if (local.length > 0) return local
  return mongo ?? []
}

async function getCredential(credentialId: string): Promise<StoredCredential | null> {
  const mongo = await withMongo(() =>
    prisma.webAuthnCredential.findUnique({ where: { credentialId } })
  )
  if (mongo) {
    return {
      credentialId: mongo.credentialId,
      userId: mongo.userId,
      publicKey: mongo.publicKey,
      counter: mongo.counter,
      transports: mongo.transports,
    }
  }
  return findLocalCredentialById(credentialId)
}

async function saveCredential(data: {
  userId: string
  credentialId: string
  publicKey: string
  counter: number
  deviceType?: string
  backedUp?: boolean
  transports?: string[]
}) {
  const transports = data.transports ? JSON.stringify(data.transports) : null
  const created = await withMongo(() =>
    prisma.webAuthnCredential.create({
      data: {
        userId: data.userId,
        credentialId: data.credentialId,
        publicKey: data.publicKey,
        counter: data.counter,
        deviceType: data.deviceType,
        backedUp: data.backedUp ?? false,
        transports,
      },
    })
  )
  if (created) return created
  return saveLocalCredential({
    userId: data.userId,
    credentialId: data.credentialId,
    publicKey: data.publicKey,
    counter: data.counter,
    deviceType: data.deviceType,
    backedUp: data.backedUp,
    transports,
  })
}

async function bumpCounter(credentialId: string, counter: number) {
  await withMongo(() =>
    prisma.webAuthnCredential.update({
      where: { credentialId },
      data: { counter },
    })
  )
  updateLocalCredentialCounter(credentialId, counter)
}

function parseTransports(value?: string | null): string[] | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as string[]
  } catch {
    return undefined
  }
}

export type WebAuthnApiResult = {
  status: number
  body: Record<string, unknown>
  setCookie?: string
}

export async function webauthnRegisterOptions(
  headers: IncomingHttpHeaders,
  phone?: string
): Promise<WebAuthnApiResult> {
  if (!phone || !isValidPhone(phone)) {
    return { status: 400, body: { success: false, error: 'Enter a valid 10-digit Indian mobile number' } }
  }

  const { rpID, rpName, origin } = getWebAuthnConfig(headers)
  const existingUser = await findUserByPhone(phone)
  const existingCreds = existingUser ? await listCredentialsForUser(existingUser.id) : []

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: phone,
    userDisplayName: existingUser?.name || `Farmer ${phone.slice(-4)}`,
    userID: new TextEncoder().encode(phone),
    attestationType: 'none',
    excludeCredentials: existingCreds.map((credential) => ({
      id: credential.credentialId,
      transports: parseTransports(credential.transports),
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'required',
    },
  })

  return {
    status: 200,
    body: options as unknown as Record<string, unknown>,
    setCookie: challengeCookie(
      { phone, challenge: options.challenge, type: 'register', exp: Date.now() + CHALLENGE_TTL_MS },
      origin.startsWith('https://')
    ),
  }
}

export async function webauthnRegisterVerify(
  headers: IncomingHttpHeaders,
  cookieHeader: string | undefined,
  body: { phone?: string; attResp?: RegistrationResponseJSON }
): Promise<WebAuthnApiResult> {
  const { phone, attResp } = body
  const { rpID, origin } = getWebAuthnConfig(headers)
  const secure = origin.startsWith('https://')

  if (!phone || !isValidPhone(phone) || !attResp) {
    return {
      status: 400,
      body: { success: false, error: 'Phone number and authenticator response are required' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  const challenge = readChallenge(cookieHeader)
  if (!challenge || challenge.phone !== phone || challenge.type !== 'register') {
    return {
      status: 400,
      body: { success: false, error: 'Face ID session expired. Please try again.' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  const verification = await verifyRegistrationResponse({
    response: attResp,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  })

  if (!verification.verified || !verification.registrationInfo) {
    return {
      status: 401,
      body: { success: false, error: 'Face ID / fingerprint verification failed' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  let user = await findUserByPhone(phone)
  if (!user) {
    user = await createUserWithPhoneAndFace(phone)
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo
  await saveCredential({
    userId: user.id,
    credentialId: credential.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports,
  })

  const token = generateToken(user.id, user.phone || user.id)
  return {
    status: 200,
    body: createAuthResponse(
      true,
      toPublicUser(user),
      token,
      'Account created with Face ID / fingerprint'
    ) as unknown as Record<string, unknown>,
    setCookie: clearChallengeCookie(secure),
  }
}

export async function webauthnLoginOptions(
  headers: IncomingHttpHeaders,
  phone?: string
): Promise<WebAuthnApiResult> {
  if (!phone || !isValidPhone(phone)) {
    return { status: 400, body: { success: false, error: 'Enter a valid 10-digit Indian mobile number' } }
  }

  const user = await findUserByPhone(phone)
  if (!user) {
    return {
      status: 401,
      body: { success: false, error: 'No account found with this phone number. Please create an account first.' },
    }
  }

  const credentials = await listCredentialsForUser(user.id)
  if (credentials.length === 0) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'No Face ID / fingerprint is registered for this number on this device. Create an account first.',
      },
    }
  }

  const { rpID, origin } = getWebAuthnConfig(headers)
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: credentials.map((credential) => ({
      id: credential.credentialId,
      transports: parseTransports(credential.transports),
    })),
  })

  return {
    status: 200,
    body: options as unknown as Record<string, unknown>,
    setCookie: challengeCookie(
      { phone, challenge: options.challenge, type: 'login', exp: Date.now() + CHALLENGE_TTL_MS },
      origin.startsWith('https://')
    ),
  }
}

export async function webauthnLoginVerify(
  headers: IncomingHttpHeaders,
  cookieHeader: string | undefined,
  body: { phone?: string; authResp?: AuthenticationResponseJSON }
): Promise<WebAuthnApiResult> {
  const { phone, authResp } = body
  const { rpID, origin } = getWebAuthnConfig(headers)
  const secure = origin.startsWith('https://')

  if (!phone || !isValidPhone(phone) || !authResp) {
    return {
      status: 400,
      body: { success: false, error: 'Phone number and authenticator response are required' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  const challenge = readChallenge(cookieHeader)
  if (!challenge || challenge.phone !== phone || challenge.type !== 'login') {
    return {
      status: 400,
      body: { success: false, error: 'Face ID session expired. Please try again.' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  const stored = await getCredential(authResp.id)
  if (!stored) {
    return {
      status: 401,
      body: { success: false, error: 'This device is not registered. Create an account first.' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  const verification = await verifyAuthenticationResponse({
    response: authResp,
    expectedChallenge: challenge.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: stored.credentialId,
      publicKey: isoBase64URL.toBuffer(stored.publicKey),
      counter: stored.counter,
      transports: parseTransports(stored.transports),
    },
  })

  if (!verification.verified) {
    return {
      status: 401,
      body: { success: false, error: 'Face ID / fingerprint verification failed' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  await bumpCounter(stored.credentialId, verification.authenticationInfo.newCounter)
  const user = await findUserById(stored.userId)
  if (!user) {
    return {
      status: 401,
      body: { success: false, error: 'Account not found' },
      setCookie: clearChallengeCookie(secure),
    }
  }

  const token = generateToken(user.id, user.phone || user.id)
  return {
    status: 200,
    body: createAuthResponse(
      true,
      toPublicUser(user),
      token,
      'Signed in with Face ID / fingerprint'
    ) as unknown as Record<string, unknown>,
    setCookie: clearChallengeCookie(secure),
  }
}
