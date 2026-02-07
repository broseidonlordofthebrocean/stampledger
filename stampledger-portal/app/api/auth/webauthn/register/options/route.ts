import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { generateWebAuthnRegistrationOptions } from '@/lib/webauthn'
import { getDb, users, webauthnCredentials, authChallenges } from '@/lib/db'
import { eq } from 'drizzle-orm'

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

    const db = getDb()

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get existing credentials to exclude
    const existing = await db.select({ credentialId: webauthnCredentials.credentialId })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, user.id))

    const options = await generateWebAuthnRegistrationOptions({
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      existingCredentialIds: existing.map(c => c.credentialId),
    })

    // Store challenge
    const challengeId = generateId()
    await db.insert(authChallenges).values({
      id: challengeId,
      challengeType: 'webauthn_register',
      challengeData: JSON.stringify({ challenge: options.challenge, userId: user.id }),
      userId: user.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
    })

    return NextResponse.json({ options, challengeId })
  } catch (error) {
    console.error('WebAuthn register options error:', error)
    return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 })
  }
}

export const runtime = 'edge'
