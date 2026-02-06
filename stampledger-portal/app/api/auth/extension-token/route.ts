import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, verifyPassword, generateId } from '@/lib/auth'
import { getDb, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { SignJWT } from 'jose'
import { getRequestContext } from '@cloudflare/next-on-pages'

const EXTENSION_TOKEN_EXPIRY = '7d'

// POST /api/auth/extension-token
// Two modes:
// 1. With Authorization header: issues extension token from existing session
// 2. With email/password body: direct login for extensions (Acrobat, browser)
export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const authHeader = req.headers.get('Authorization')
    const existingToken = extractToken(authHeader)

    let userId: string

    if (existingToken) {
      // Mode 1: Exchange existing token for extension token
      const payload = await verifyToken(existingToken)
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
    } else {
      // Mode 2: Direct login with email/password
      const body = await req.json()
      const { email, password } = body

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        )
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get()

      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const valid = await verifyPassword(password, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      userId = user.id
    }

    // Get user info
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Sign extension token with limited scope
    const { env } = getRequestContext()
    const secret = (env as any).JWT_SECRET || 'dev-secret-change-in-production'
    const jwtSecret = new TextEncoder().encode(secret)

    const extensionToken = await new SignJWT({
      userId: user.id,
      scope: 'extension',
      type: 'extension',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(EXTENSION_TOKEN_EXPIRY)
      .sign(jwtSecret)

    return NextResponse.json({
      token: extensionToken,
      expiresIn: '7d',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
      },
    })
  } catch (error) {
    console.error('Extension token error:', error)
    return NextResponse.json(
      { error: 'Failed to generate extension token' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'
