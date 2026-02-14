import { SignJWT, jwtVerify } from 'jose'
import { getRequestContext } from '@cloudflare/next-on-pages'

const JWT_EXPIRY = '24h'

// Get JWT secret as Uint8Array for jose
function getJwtSecret(): Uint8Array {
  const { env } = getRequestContext()
  const secret = (env as any).JWT_SECRET || 'dev-secret-change-in-production'
  return new TextEncoder().encode(secret)
}

// Sign a JWT token
export async function signToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret())
  return token
}

// Verify a JWT token
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

// Hash password using Web Crypto API (edge-compatible)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // Use PBKDF2 for password hashing
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // Derive key bits
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )

  // Combine salt and derived key for storage
  const hashArray = new Uint8Array(derivedBits)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  // Return as base64
  return btoa(String.fromCharCode(...combined))
}

// Verify password against hash
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Decode the stored hash
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0))

    // Extract salt (first 16 bytes) and hash
    const salt = combined.slice(0, 16)
    const storedDerivedKey = combined.slice(16)

    // Hash the input password with the same salt
    const encoder = new TextEncoder()
    const data = encoder.encode(password)

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    )

    const derivedKey = new Uint8Array(derivedBits)

    // Compare the hashes
    if (derivedKey.length !== storedDerivedKey.length) return false
    for (let i = 0; i < derivedKey.length; i++) {
      if (derivedKey[i] !== storedDerivedKey[i]) return false
    }
    return true
  } catch {
    return false
  }
}

// Generate a unique ID
export function generateId(): string {
  return crypto.randomUUID()
}

// Check if user has a real password (not OAuth-only sentinel)
export function hasPassword(passwordHash: string | null): boolean {
  return passwordHash !== null && passwordHash !== 'NO_PASSWORD'
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

// Dual-auth: authenticate via JWT or API key
export async function authenticateRequest(req: Request): Promise<{
  authenticated: boolean
  userId?: string
  orgId?: string | null
  authMethod: 'jwt' | 'api_key' | 'none'
  scopes?: string[]
  error?: string
}> {
  const authHeader = req.headers.get('Authorization')
  const token = extractToken(authHeader)

  if (!token) {
    return { authenticated: false, authMethod: 'none', error: 'No authorization provided' }
  }

  // Check if it's an API key (starts with slk_)
  if (token.startsWith('slk_')) {
    const { verifyApiKey } = await import('@/lib/api-keys')
    const result = await verifyApiKey(token)

    if (!result.valid) {
      return { authenticated: false, authMethod: 'api_key', error: result.error }
    }

    return {
      authenticated: true,
      userId: result.userId || undefined,
      orgId: result.orgId,
      authMethod: 'api_key',
      scopes: result.scopes,
    }
  }

  // Standard JWT auth
  const payload = await verifyToken(token)
  if (!payload) {
    return { authenticated: false, authMethod: 'jwt', error: 'Invalid token' }
  }

  return {
    authenticated: true,
    userId: payload.userId,
    authMethod: 'jwt',
    scopes: ['*'],
  }
}
