import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, hashPassword } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, users } from '@/lib/db'
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

    const admin = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!admin || !isAdminEmail(admin.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'userId and newPassword are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const targetUser = await db.select().from(users).where(eq(users.id, userId)).get()
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const passwordHash = await hashPassword(newPassword)

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId))

    return NextResponse.json({
      message: `Password reset for ${targetUser.email}`,
    })
  } catch (error) {
    console.error('Admin password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
