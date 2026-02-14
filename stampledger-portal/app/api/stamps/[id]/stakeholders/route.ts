import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, stamps, stampStakeholders } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { sendEmail } from '@/lib/email'

// GET /api/stamps/[id]/stakeholders - List stakeholders for a stamp
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

    // Verify ownership
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

    const stakeholders = await db
      .select()
      .from(stampStakeholders)
      .where(eq(stampStakeholders.stampId, id))

    return NextResponse.json({ stakeholders })
  } catch (error) {
    console.error('Get stakeholders error:', error)
    return NextResponse.json({ error: 'Failed to get stakeholders' }, { status: 500 })
  }
}

// POST /api/stamps/[id]/stakeholders - Add a stakeholder
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
    const { email, name, role } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const db = getDb()

    // Verify ownership
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

    const stakeholderId = generateId()
    const now = new Date()

    await db.insert(stampStakeholders).values({
      id: stakeholderId,
      stampId: id,
      email,
      name: name || null,
      role: role || null,
      notifiedAt: now,
      createdAt: now,
    })

    // Send notification (stubbed)
    await sendEmail({
      to: email,
      subject: `You've been added as a stakeholder on a StampLedger stamp`,
      body: `Hello${name ? ` ${name}` : ''},\n\nYou have been added as a ${role || 'stakeholder'} on stamp ${stamp.projectName || stamp.id}.\n\nVerify: ${stamp.verifyUrl || `https://portal.stampledger.com/verify/${stamp.id}`}\n\nBest regards,\nThe StampLedger Team`,
    })

    const stakeholder = await db
      .select()
      .from(stampStakeholders)
      .where(eq(stampStakeholders.id, stakeholderId))
      .get()

    return NextResponse.json({ stakeholder })
  } catch (error) {
    console.error('Add stakeholder error:', error)
    return NextResponse.json({ error: 'Failed to add stakeholder' }, { status: 500 })
  }
}

// DELETE /api/stamps/[id]/stakeholders - Remove a stakeholder
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const stakeholderId = searchParams.get('stakeholderId')

    if (!stakeholderId) {
      return NextResponse.json({ error: 'Stakeholder ID required' }, { status: 400 })
    }

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

    // Verify stamp ownership
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

    await db.delete(stampStakeholders).where(eq(stampStakeholders.id, stakeholderId))

    return NextResponse.json({ message: 'Stakeholder removed' })
  } catch (error) {
    console.error('Remove stakeholder error:', error)
    return NextResponse.json({ error: 'Failed to remove stakeholder' }, { status: 500 })
  }
}
export const runtime = 'edge'
