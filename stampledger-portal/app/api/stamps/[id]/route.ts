import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { getDb, stamps, stampStakeholders } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { sendEmail, EMAIL_CONFIG } from '@/lib/email'

// GET /api/stamps/[id] - Get stamp details
export async function GET(
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

    const stamp = await db
      .select()
      .from(stamps)
      .where(
        and(
          eq(stamps.id, id),
          eq(stamps.userId, payload.userId)
        )
      )
      .get()

    if (!stamp) {
      return NextResponse.json({ error: 'Stamp not found' }, { status: 404 })
    }

    return NextResponse.json({ stamp })
  } catch (error) {
    console.error('Get stamp error:', error)
    return NextResponse.json({ error: 'Failed to get stamp' }, { status: 500 })
  }
}

// POST /api/stamps/[id]/revoke - Revoke a stamp
export async function POST(
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

    const body = await req.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Revocation reason is required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check stamp exists and belongs to user
    const stamp = await db
      .select()
      .from(stamps)
      .where(
        and(
          eq(stamps.id, id),
          eq(stamps.userId, payload.userId)
        )
      )
      .get()

    if (!stamp) {
      return NextResponse.json({ error: 'Stamp not found' }, { status: 404 })
    }

    if (stamp.status === 'revoked') {
      return NextResponse.json(
        { error: 'Stamp is already revoked' },
        { status: 400 }
      )
    }

    // Revoke the stamp
    const revokedAt = new Date()
    await db
      .update(stamps)
      .set({
        status: 'revoked',
        revokedAt,
        revokedReason: reason,
      })
      .where(eq(stamps.id, id))

    // Notify stakeholders about revocation
    const stakeholders = await db
      .select()
      .from(stampStakeholders)
      .where(eq(stampStakeholders.stampId, id))

    for (const s of stakeholders) {
      await sendEmail({
        to: s.email,
        subject: EMAIL_CONFIG.templates.stampRevoked.subject(stamp.projectName || 'Unknown Project'),
        body: EMAIL_CONFIG.templates.stampRevoked.getBody(
          stamp.projectName || 'Unknown Project',
          reason,
          stamp.id
        ),
      })
    }

    // Fetch updated stamp
    const updatedStamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, id))
      .get()

    return NextResponse.json({ stamp: updatedStamp })
  } catch (error) {
    console.error('Revoke stamp error:', error)
    return NextResponse.json({ error: 'Failed to revoke stamp' }, { status: 500 })
  }
}
export const runtime = 'edge'
