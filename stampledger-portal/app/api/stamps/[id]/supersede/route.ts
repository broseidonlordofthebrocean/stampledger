import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, stamps, stampStakeholders } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { getVerifyUrl } from '@/lib/qrcode'
import { sendEmail, EMAIL_CONFIG } from '@/lib/email'

// POST /api/stamps/[id]/supersede - Supersede a stamp with a new version
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
    const { reason, newDocumentHash, newDocumentFilename, newDocumentSize, scopeNotes } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Supersession reason is required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check stamp exists and belongs to user
    const oldStamp = await db
      .select()
      .from(stamps)
      .where(
        and(
          eq(stamps.id, id),
          eq(stamps.userId, payload.userId)
        )
      )
      .get()

    if (!oldStamp) {
      return NextResponse.json({ error: 'Stamp not found' }, { status: 404 })
    }

    if (oldStamp.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active stamps can be superseded' },
        { status: 400 }
      )
    }

    const now = new Date()
    let newStamp = null

    // If new document hash provided, create replacement stamp
    if (newDocumentHash) {
      const newStampId = generateId()
      const verifyUrl = getVerifyUrl(newStampId)
      const blockchainId = `local-${newStampId}`

      await db.insert(stamps).values({
        id: newStampId,
        blockchainId,
        documentHash: newDocumentHash,
        jurisdictionId: oldStamp.jurisdictionId,
        projectName: oldStamp.projectName,
        permitNumber: oldStamp.permitNumber,
        notes: oldStamp.notes,
        documentFilename: newDocumentFilename || null,
        documentSize: newDocumentSize || null,
        status: 'active',
        scopeNotes: scopeNotes || oldStamp.scopeNotes || null,
        insuranceSnapshot: oldStamp.insuranceSnapshot,
        qrCodeDataUrl: null,
        verifyUrl,
        projectId: oldStamp.projectId,
        orgId: oldStamp.orgId,
        licenseId: oldStamp.licenseId,
        createdAt: now,
        userId: payload.userId,
      })

      // Mark old stamp as superseded
      await db
        .update(stamps)
        .set({
          status: 'superseded',
          supersededBy: newStampId,
          supersededAt: now,
          supersessionReason: reason,
        })
        .where(eq(stamps.id, id))

      newStamp = await db
        .select()
        .from(stamps)
        .where(eq(stamps.id, newStampId))
        .get()

      // Copy stakeholders to new stamp
      const oldStakeholders = await db
        .select()
        .from(stampStakeholders)
        .where(eq(stampStakeholders.stampId, id))

      for (const s of oldStakeholders) {
        await db.insert(stampStakeholders).values({
          id: generateId(),
          stampId: newStampId,
          email: s.email,
          name: s.name,
          role: s.role,
          createdAt: now,
        })
      }

      // Notify stakeholders about supersession (stubbed)
      for (const s of oldStakeholders) {
        await sendEmail({
          to: s.email,
          subject: EMAIL_CONFIG.templates.stampSuperseded.subject(oldStamp.projectName || 'Unknown Project'),
          body: EMAIL_CONFIG.templates.stampSuperseded.getBody(
            oldStamp.projectName || 'Unknown Project',
            reason,
            id,
            newStampId,
            verifyUrl
          ),
        })
      }
    } else {
      // Just mark as superseded without creating replacement
      await db
        .update(stamps)
        .set({
          status: 'superseded',
          supersededAt: now,
          supersessionReason: reason,
        })
        .where(eq(stamps.id, id))
    }

    const updatedOldStamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, id))
      .get()

    return NextResponse.json({
      oldStamp: updatedOldStamp,
      newStamp,
      message: newStamp
        ? 'Stamp superseded and new version created'
        : 'Stamp superseded',
    })
  } catch (error) {
    console.error('Supersede stamp error:', error)
    return NextResponse.json({ error: 'Failed to supersede stamp' }, { status: 500 })
  }
}
export const runtime = 'edge'
