import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, verifyPassword, signToken } from '@/lib/auth'
import { getDb, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

// POST /api/auth/extension-token
// Two modes:
// 1. With Authorization header: issues extension token from existing session
// 2. With email/password body: direct login for extensions (Acrobat, browser)
export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const authHeader = req.headers.get('Authorization')
    const existingToken = extractToken(authHeader)

    let userId: string | null = null

    if (existingToken) {
      // Mode 1: Exchange existing token for extension token
      const payload = await verifyToken(existingToken)
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
    } else {
      // Mode 2: Direct login with email/password
      let body: any
      try {
        body = await req.json()
      } catch {
        return NextResponse.json(
          { error: 'Request body required when no Authorization header provided' },
          { status: 400 }
        )
      }

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

    if (!userId) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
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

    // Sign extension token (reuses same JWT signing as regular tokens)
    const extensionToken = await signToken(user.id)

    return NextResponse.json({
      token: extensionToken,
      expiresIn: '24h',
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
