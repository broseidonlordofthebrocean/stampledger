import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, professionalLicenses, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

// POST /api/admin/licenses/verify - Admin manual license verification
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

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { licenseId, action, notes } = body

    if (!licenseId || !action) {
      return NextResponse.json(
        { error: 'License ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the license
    const license = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    const now = new Date()
    const newStatus = action === 'approve' ? 'active' : 'revoked'

    await db
      .update(professionalLicenses)
      .set({
        status: newStatus,
        verificationSource: 'manual_review',
        lastVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(professionalLicenses.id, licenseId))

    const updatedLicense = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    return NextResponse.json({
      message: `License ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      license: updatedLicense
        ? {
            ...updatedLicense,
            disciplines: updatedLicense.disciplines
              ? JSON.parse(updatedLicense.disciplines)
              : [],
          }
        : null,
    })
  } catch (error) {
    console.error('Admin license verification error:', error)
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'
