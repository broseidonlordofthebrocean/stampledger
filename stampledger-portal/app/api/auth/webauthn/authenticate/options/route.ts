import { NextRequest, NextResponse } from 'next/server'
import { generateId } from '@/lib/auth'
import { generateWebAuthnAuthOptions } from '@/lib/webauthn'
import type { AuthenticatorTransportFuture } from '@/lib/webauthn'
import { getDb, users, webauthnCredentials, authChallenges } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email } = body as { email?: string }

    const db = getDb()
    let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined

    // If email provided, narrow to that user's credentials
    if (email) {
      const user = await db.select().from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get()

      if (user) {
        const creds = await db.select().from(webauthnCredentials)
          .where(eq(webauthnCredentials.userId, user.id))

        if (creds.length > 0) {
          allowCredentials = creds.map(c => ({
            id: c.credentialId,
            transports: c.transports ? JSON.parse(c.transports) : undefined,
          }))
        }
      }
    }

    const options = await generateWebAuthnAuthOptions({ allowCredentials })

    // Store challenge
    const challengeId = generateId()
    await db.insert(authChallenges).values({
      id: challengeId,
      challengeType: 'webauthn_authenticate',
      challengeData: JSON.stringify({ challenge: options.challenge }),
      userId: null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
    })

    return NextResponse.json({ options, challengeId })
  } catch (error) {
    console.error('WebAuthn authenticate options error:', error)
    return NextResponse.json({ error: 'Failed to generate authentication options' }, { status: 500 })
  }
}

export const runtime = 'edge'
