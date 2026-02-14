import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, professionalLicenses, users } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import {
  verifyTexasLicense,
  isAutomatedVerificationSupported,
  getStateBoardUrl,
  type VerificationResult,
} from '@/lib/license-verification'

// GET /api/licenses - List user's professional licenses
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

    const licenses = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.userId, payload.userId))
      .orderBy(desc(professionalLicenses.createdAt))

    // Parse disciplines JSON for each license
    const parsedLicenses = licenses.map((l) => ({
      ...l,
      disciplines: l.disciplines ? JSON.parse(l.disciplines) : [],
    }))

    return NextResponse.json({ licenses: parsedLicenses })
  } catch (error) {
    console.error('Get licenses error:', error)
    return NextResponse.json({ error: 'Failed to get licenses' }, { status: 500 })
  }
}

// POST /api/licenses - Add a new professional license
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
    const {
      licenseType,
      licenseNumber,
      issuingState,
      issuingBody,
      disciplines,
      issuedDate,
      expirationDate,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceCoverageAmount,
      insuranceExpirationDate,
    } = body

    // Validation
    if (!licenseType || !licenseNumber || !issuingState) {
      return NextResponse.json(
        { error: 'License type, number, and issuing state are required' },
        { status: 400 }
      )
    }

    const validTypes = ['PE', 'PLS', 'RA', 'CPA', 'ESQ']
    if (!validTypes.includes(licenseType)) {
      return NextResponse.json(
        { error: `Invalid license type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (issuingState.length !== 2) {
      return NextResponse.json(
        { error: 'Issuing state must be a 2-letter code' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if license already exists
    const existing = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.licenseNumber, licenseNumber))
      .get()

    if (existing) {
      return NextResponse.json(
        { error: 'This license number is already registered' },
        { status: 409 }
      )
    }

    const licenseId = generateId()
    const now = new Date()

    await db.insert(professionalLicenses).values({
      id: licenseId,
      userId: payload.userId,
      licenseType,
      licenseNumber,
      issuingState: issuingState.toUpperCase(),
      issuingBody: issuingBody || null,
      disciplines: disciplines ? JSON.stringify(disciplines) : null,
      status: 'pending_verification',
      issuedDate: issuedDate ? new Date(issuedDate) : null,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      verificationSource: 'user_submitted',
      insuranceProvider: insuranceProvider || null,
      insurancePolicyNumber: insurancePolicyNumber || null,
      insuranceCoverageAmount: insuranceCoverageAmount || null,
      insuranceExpirationDate: insuranceExpirationDate ? new Date(insuranceExpirationDate) : null,
      stampTokenCount: 0,
      createdAt: now,
      updatedAt: now,
    })

    // Update user's isLicensedProfessional flag
    await db
      .update(users)
      .set({ isLicensedProfessional: true, updatedAt: now })
      .where(eq(users.id, payload.userId))

    // Auto-verify TX PE licenses against TBPE roster
    let verificationResult: VerificationResult | null = null
    const upperState = issuingState.toUpperCase()

    if (licenseType === 'PE' && isAutomatedVerificationSupported(upperState)) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.userId))
        .get()

      if (user) {
        verificationResult = await verifyTexasLicense(
          licenseNumber,
          user.firstName,
          user.lastName
        )

        if (verificationResult.verified) {
          await db
            .update(professionalLicenses)
            .set({
              status: 'active',
              verificationSource: 'state_board_api',
              lastVerifiedAt: now,
              issuingBody: verificationResult.boardName || issuingBody || null,
              updatedAt: now,
            })
            .where(eq(professionalLicenses.id, licenseId))
        }
      }
    }

    const newLicense = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    return NextResponse.json({
      license: {
        ...newLicense,
        disciplines: newLicense?.disciplines ? JSON.parse(newLicense.disciplines) : [],
      },
      verificationResult,
      lookupUrl: getStateBoardUrl(upperState),
      message: verificationResult?.verified
        ? 'License added and verified!'
        : 'License added. Verification pending.',
    })
  } catch (error) {
    console.error('Add license error:', error)
    return NextResponse.json({ error: 'Failed to add license' }, { status: 500 })
  }
}

// DELETE /api/licenses - Remove a license (via query param id)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const licenseId = searchParams.get('id')

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID required' }, { status: 400 })
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

    // Verify ownership
    const license = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    if (!license || license.userId !== payload.userId) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    // Can't delete if stamps exist with this license
    if (license.stampTokenCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete license with existing stamps' },
        { status: 400 }
      )
    }

    await db.delete(professionalLicenses).where(eq(professionalLicenses.id, licenseId))

    // Check if user has other licenses
    const remainingLicenses = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.userId, payload.userId))

    if (remainingLicenses.length === 0) {
      await db
        .update(users)
        .set({ isLicensedProfessional: false, updatedAt: new Date() })
        .where(eq(users.id, payload.userId))
    }

    return NextResponse.json({ message: 'License removed' })
  } catch (error) {
    console.error('Delete license error:', error)
    return NextResponse.json({ error: 'Failed to delete license' }, { status: 500 })
  }
}
export const runtime = 'edge'
