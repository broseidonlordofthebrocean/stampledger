import { SignJWT, jwtVerify } from 'jose'

const JWT_EXPIRY = '24h'

// Get JWT secret as Uint8Array for jose
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production'
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

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}
