import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { getDb, apiKeys } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// DELETE /api/keys/[id] - Revoke an API key (soft delete)
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

    // Verify key belongs to user
    const key = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          eq(apiKeys.userId, payload.userId)
        )
      )
      .get()

    if (!key) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Soft delete
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id))

    return NextResponse.json({ message: 'API key revoked' })
  } catch (error) {
    console.error('Revoke API key error:', error)
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }
}
export const runtime = 'edge'
