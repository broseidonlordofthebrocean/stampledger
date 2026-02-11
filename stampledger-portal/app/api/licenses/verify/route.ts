import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { getDb, professionalLicenses, users } from '@/lib/db'
import { eq } from 'drizzle-orm'
import {
  verifyTexasLicense,
  isAutomatedVerificationSupported,
  getStateBoardUrl,
} from '@/lib/license-verification'

// POST /api/licenses/verify - Verify a professional license
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
    const { licenseId } = body

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID is required' }, { status: 400 })
    }

    const db = getDb()

    // Get the license and verify ownership
    const license = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    if (!license || license.userId !== payload.userId) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    const state = license.issuingState.toUpperCase()

    // Check if automated verification is supported
    if (!isAutomatedVerificationSupported(state)) {
      return NextResponse.json({
        supported: false,
        lookupUrl: getStateBoardUrl(state),
        message: `Automated verification is not yet available for ${state}. Use the lookup URL to verify manually.`,
      })
    }

    // Get user info for name matching
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .get()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Run verification
    const result = await verifyTexasLicense(
      license.licenseNumber,
      user.firstName,
      user.lastName
    )

    const now = new Date()

    if (result.verified) {
      // Update license status
      await db
        .update(professionalLicenses)
        .set({
          status: 'active',
          verificationSource: 'state_board_api',
          lastVerifiedAt: now,
          issuingBody: result.boardName || license.issuingBody,
          updatedAt: now,
        })
        .where(eq(professionalLicenses.id, licenseId))
    }

    // Get updated license
    const updatedLicense = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    return NextResponse.json({
      ...result,
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
    console.error('License verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify license' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'
