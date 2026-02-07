import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { verifyWebAuthnRegistration } from '@/lib/webauthn'
import type { RegistrationResponseJSON } from '@/lib/webauthn'
import { consumeChallenge } from '@/lib/auth-challenges'
import { getDb, webauthnCredentials } from '@/lib/db'

// Base64url encode a Uint8Array or string
function toBase64url(input: Uint8Array | string): string {
  if (typeof input === 'string') return input
  const base64 = btoa(String.fromCharCode(...input))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

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
    const { challengeId, response, deviceName } = body as {
      challengeId: string
      response: RegistrationResponseJSON
      deviceName?: string
    }

    if (!challengeId || !response) {
      return NextResponse.json({ error: 'Missing challengeId or response' }, { status: 400 })
    }

    // Consume the stored challenge
    const challenge = await consumeChallenge(challengeId)
    if (!challenge || challenge.challengeType !== 'webauthn_register') {
      return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 400 })
    }

    const { challenge: expectedChallenge, userId } = challenge.challengeData as {
      challenge: string
      userId: string
    }

    if (userId !== payload.userId) {
      return NextResponse.json({ error: 'Challenge user mismatch' }, { status: 403 })
    }

    // Verify the registration response
    const verification = await verifyWebAuthnRegistration({
      response,
      expectedChallenge,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 })
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    const db = getDb()

    // Store the credential
    await db.insert(webauthnCredentials).values({
      id: generateId(),
      userId: payload.userId,
      credentialId: toBase64url(credential.id as any),
      credentialPublicKey: toBase64url(credential.publicKey as any),
      counter: credential.counter,
      credentialDeviceType,
      credentialBackedUp,
      transports: response.response.transports ? JSON.stringify(response.response.transports) : null,
      deviceName: deviceName || null,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WebAuthn register verify error:', error)
    return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 })
  }
}

export const runtime = 'edge'
