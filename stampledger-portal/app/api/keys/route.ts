import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { getDb, apiKeys } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { generateApiKey } from '@/lib/api-keys'

// GET /api/keys - List user's API keys (prefix only, never full key)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = getDb()

    const keys = await db
      .select({
        id: apiKeys.id,
        keyPrefix: apiKeys.keyPrefix,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, payload.userId))

    const parsedKeys = keys.map(k => ({
      ...k,
      scopes: k.scopes ? JSON.parse(k.scopes) : [],
    }))

    return NextResponse.json({ keys: parsedKeys })
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json({ error: 'Failed to get API keys' }, { status: 500 })
  }
}

// POST /api/keys - Create a new API key (returns plaintext ONCE)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { name, scopes, expiresInDays } = body

    if (!name) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    const result = await generateApiKey({
      userId: payload.userId,
      name,
      scopes,
      expiresInDays,
    })

    return NextResponse.json({
      key: result.key, // Plaintext - shown only once!
      id: result.id,
      prefix: result.prefix,
      name,
      message: 'Save this key now. It will not be shown again.',
    })
  } catch (error) {
    console.error('Create API key error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
export const runtime = 'edge'
