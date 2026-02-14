import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { getDb, stamps, users, professionalLicenses } from '@/lib/db'
import { eq } from 'drizzle-orm'

// GET /api/insurance/verify-stamp?stamp_id=X&as_of_date=Y
// API key auth required (for insurance company integrations)
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req)

    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    // Check scope
    if (auth.authMethod === 'api_key' && auth.scopes && !auth.scopes.includes('read:insurance') && !auth.scopes.includes('*')) {
      return NextResponse.json({ error: 'Insufficient scope. Requires read:insurance' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const stampId = searchParams.get('stamp_id')
    const asOfDate = searchParams.get('as_of_date')

    if (!stampId) {
      return NextResponse.json({ error: 'stamp_id parameter is required' }, { status: 400 })
    }

    const db = getDb()

    // Get stamp
    const stamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, stampId))
      .get()

    if (!stamp) {
      return NextResponse.json({ error: 'Stamp not found' }, { status: 404 })
    }

    // Get PE/license info
    const pe = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        peLicenseNumber: users.peLicenseNumber,
        peState: users.peState,
      })
      .from(users)
      .where(eq(users.id, stamp.userId))
      .get()

    // Get current license info
    let currentLicense = null
    if (stamp.licenseId) {
      currentLicense = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.id, stamp.licenseId))
        .get()
    } else {
      currentLicense = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.userId, stamp.userId))
        .get()
    }

    // Parse insurance snapshot (captured at stamp time)
    let insuranceAtStampTime = null
    if (stamp.insuranceSnapshot) {
      try { insuranceAtStampTime = JSON.parse(stamp.insuranceSnapshot) } catch {}
    }

    // Current insurance from license
    let currentInsurance = null
    if (currentLicense?.insuranceProvider) {
      currentInsurance = {
        provider: currentLicense.insuranceProvider,
        policyNumber: currentLicense.insurancePolicyNumber,
        coverageAmount: currentLicense.insuranceCoverageAmount,
        expirationDate: currentLicense.insuranceExpirationDate,
      }
    }

    const now = new Date()
    const checkDate = asOfDate ? new Date(asOfDate) : now

    // Determine insurance status
    const insuranceExpiredAtStampTime = insuranceAtStampTime?.expirationDate
      ? new Date(insuranceAtStampTime.expirationDate) < new Date(stamp.createdAt)
      : null

    const currentInsuranceExpired = currentInsurance?.expirationDate
      ? new Date(currentInsurance.expirationDate) < checkDate
      : null

    const licenseExpired = currentLicense?.expirationDate
      ? new Date(currentLicense.expirationDate) < checkDate
      : null

    return NextResponse.json({
      stamp: {
        id: stamp.id,
        status: stamp.status,
        documentHash: stamp.documentHash,
        jurisdictionId: stamp.jurisdictionId,
        projectName: stamp.projectName,
        createdAt: stamp.createdAt,
        scopeNotes: stamp.scopeNotes,
      },
      professional: pe ? {
        name: `${pe.firstName || ''} ${pe.lastName || ''}`.trim(),
        licenseNumber: pe.peLicenseNumber,
        state: pe.peState,
      } : null,
      license: currentLicense ? {
        type: currentLicense.licenseType,
        number: currentLicense.licenseNumber,
        state: currentLicense.issuingState,
        status: currentLicense.status,
        expirationDate: currentLicense.expirationDate,
        expired: licenseExpired,
      } : null,
      insuranceAtStampTime,
      currentInsurance,
      riskFlags: {
        stampRevoked: stamp.status === 'revoked',
        stampSuperseded: stamp.status === 'superseded',
        licenseExpired: licenseExpired === true,
        insuranceExpiredAtStampTime: insuranceExpiredAtStampTime === true,
        currentInsuranceExpired: currentInsuranceExpired === true,
        noInsuranceOnRecord: !insuranceAtStampTime && !currentInsurance,
      },
      blockchain: {
        id: stamp.blockchainId,
        txHash: stamp.txHash,
        verified: !!stamp.blockchainId,
      },
      checkedAt: now.toISOString(),
      asOfDate: checkDate.toISOString(),
    })
  } catch (error) {
    console.error('Insurance verify error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
export const runtime = 'edge'
