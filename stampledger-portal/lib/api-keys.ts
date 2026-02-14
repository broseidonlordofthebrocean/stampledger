import { getDb, apiKeys } from '@/lib/db'
import { generateId } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'

const KEY_PREFIX = 'slk_live_'

// Generate a new API key
export async function generateApiKey(options: {
  userId?: string
  orgId?: string
  name: string
  scopes?: string[]
  expiresInDays?: number
}): Promise<{ key: string; id: string; prefix: string }> {
  const db = getDb()
  const id = generateId()

  // Generate 32 random bytes -> 64 hex chars
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const hexKey = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const fullKey = `${KEY_PREFIX}${hexKey}`
  const prefix = `${KEY_PREFIX}${hexKey.slice(0, 8)}...`

  // Hash the key for storage
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(fullKey))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const now = new Date()
  const expiresAt = options.expiresInDays
    ? new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : null

  await db.insert(apiKeys).values({
    id,
    userId: options.userId || null,
    orgId: options.orgId || null,
    keyHash,
    keyPrefix: prefix,
    name: options.name,
    scopes: JSON.stringify(options.scopes || ['read:stamps', 'read:verify']),
    createdAt: now,
    expiresAt,
    isActive: true,
  })

  return { key: fullKey, id, prefix }
}

// Verify an API key and return the associated user/org info
export async function verifyApiKey(key: string): Promise<{
  valid: boolean
  userId?: string | null
  orgId?: string | null
  scopes?: string[]
  keyId?: string
  error?: string
}> {
  if (!key.startsWith(KEY_PREFIX)) {
    return { valid: false, error: 'Invalid key format' }
  }

  const db = getDb()

  // Hash the provided key
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(key))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const apiKey = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .get()

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' }
  }

  if (!apiKey.isActive) {
    return { valid: false, error: 'API key has been revoked' }
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return { valid: false, error: 'API key has expired' }
  }

  // Update last used
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .run()
    .catch(() => {})

  const scopes = apiKey.scopes ? JSON.parse(apiKey.scopes) : []

  return {
    valid: true,
    userId: apiKey.userId,
    orgId: apiKey.orgId,
    scopes,
    keyId: apiKey.id,
  }
}
