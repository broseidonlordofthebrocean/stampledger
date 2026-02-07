import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, hasPassword } from '@/lib/auth'
import { getDb, users, oauthAccounts, webauthnCredentials } from '@/lib/db'
import { eq } from 'drizzle-orm'

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

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const oauth = await db.select({
      id: oauthAccounts.id,
      provider: oauthAccounts.provider,
      providerEmail: oauthAccounts.providerEmail,
      providerName: oauthAccounts.providerName,
      providerAvatarUrl: oauthAccounts.providerAvatarUrl,
      createdAt: oauthAccounts.createdAt,
    }).from(oauthAccounts).where(eq(oauthAccounts.userId, user.id))

    const webauthn = await db.select({
      id: webauthnCredentials.id,
      deviceName: webauthnCredentials.deviceName,
      credentialDeviceType: webauthnCredentials.credentialDeviceType,
      lastUsedAt: webauthnCredentials.lastUsedAt,
      createdAt: webauthnCredentials.createdAt,
    }).from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id))

    return NextResponse.json({
      oauthAccounts: oauth,
      webauthnCredentials: webauthn,
      hasPassword: hasPassword(user.passwordHash),
    })
  } catch (error) {
    console.error('Get linked accounts error:', error)
    return NextResponse.json({ error: 'Failed to get linked accounts' }, { status: 500 })
  }
}

export const runtime = 'edge'
