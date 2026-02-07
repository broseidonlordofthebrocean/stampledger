import { NextRequest, NextResponse } from 'next/server'
import { signToken } from '@/lib/auth'
import { verifyWebAuthnAuth } from '@/lib/webauthn'
import type { AuthenticationResponseJSON } from '@/lib/webauthn'
import { consumeChallenge } from '@/lib/auth-challenges'
import { getDb, users, webauthnCredentials } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Base64url decode to Uint8Array
function base64urlToUint8Array(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { challengeId, response } = body as {
      challengeId: string
      response: AuthenticationResponseJSON
    }

    if (!challengeId || !response) {
      return NextResponse.json({ error: 'Missing challengeId or response' }, { status: 400 })
    }

    // Consume the stored challenge
    const challenge = await consumeChallenge(challengeId)
    if (!challenge || challenge.challengeType !== 'webauthn_authenticate') {
      return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 400 })
    }

    const { challenge: expectedChallenge } = challenge.challengeData as { challenge: string }

    const db = getDb()

    // Find the credential
    const credential = await db.select().from(webauthnCredentials)
      .where(eq(webauthnCredentials.credentialId, response.id))
      .get()

    if (!credential) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    // Find the user
    const user = await db.select().from(users)
      .where(eq(users.id, credential.userId))
      .get()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the authentication response
    const verification = await verifyWebAuthnAuth({
      response,
      expectedChallenge,
      credentialPublicKey: base64urlToUint8Array(credential.credentialPublicKey),
      credentialCurrentCounter: credential.counter,
      credentialID: credential.credentialId,
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 })
    }

    // Update credential counter and lastUsedAt
    const now = new Date()
    await db.update(webauthnCredentials).set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: now,
    }).where(eq(webauthnCredentials.id, credential.id))

    // Update user lastLoginAt
    await db.update(users).set({ lastLoginAt: now })
      .where(eq(users.id, user.id))

    // Sign JWT
    const token = await signToken(user.id)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      },
    })
  } catch (error) {
    console.error('WebAuthn authenticate verify error:', error)
    return NextResponse.json({ error: 'Failed to verify authentication' }, { status: 500 })
  }
}

export const runtime = 'edge'
