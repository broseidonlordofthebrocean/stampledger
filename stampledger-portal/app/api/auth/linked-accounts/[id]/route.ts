import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, hasPassword } from '@/lib/auth'
import { getDb, users, oauthAccounts, webauthnCredentials } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Count remaining auth methods
    const oauthCount = await db.select({ id: oauthAccounts.id })
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, user.id))

    const waCount = await db.select({ id: webauthnCredentials.id })
      .from(webauthnCredentials)
      .where(eq(webauthnCredentials.userId, user.id))

    const passwordCount = hasPassword(user.passwordHash) ? 1 : 0
    const totalMethods = oauthCount.length + waCount.length + passwordCount

    if (totalMethods <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove your last authentication method' },
        { status: 400 }
      )
    }

    // Try to delete from oauth_accounts first
    const oauthDeleted = await db.delete(oauthAccounts)
      .where(and(eq(oauthAccounts.id, id), eq(oauthAccounts.userId, user.id)))
      .returning()

    if (oauthDeleted.length > 0) {
      return NextResponse.json({ success: true, type: 'oauth' })
    }

    // Try webauthn_credentials
    const waDeleted = await db.delete(webauthnCredentials)
      .where(and(eq(webauthnCredentials.id, id), eq(webauthnCredentials.userId, user.id)))
      .returning()

    if (waDeleted.length > 0) {
      return NextResponse.json({ success: true, type: 'webauthn' })
    }

    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  } catch (error) {
    console.error('Delete linked account error:', error)
    return NextResponse.json({ error: 'Failed to remove linked account' }, { status: 500 })
  }
}

export const runtime = 'edge'
