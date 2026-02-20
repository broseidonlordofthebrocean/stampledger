import { NextRequest, NextResponse } from 'next/server'
import { getDb, stamps, users, professionalLicenses, documents, verificationLogs, verificationScans } from '@/lib/db'
import { generateId } from '@/lib/auth'
import { eq, and, count } from 'drizzle-orm'

// GET /api/verify/[id] - Public verification endpoint (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const now = new Date()

    // Find stamp
    const stamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, id))
      .get()

    if (!stamp) {
      // Log failed verification
      await db.insert(verificationLogs).values({
        id: generateId(),
        stampId: id,
        verifiedAt: now,
        verificationMethod: 'web',
        result: 'not_found',
        createdAt: now,
      }).run().catch(err => console.warn('Log insert failed:', err)) // Don't fail on log errors

      return NextResponse.json(
        {
          valid: false,
          error: 'Stamp not found',
          message: 'No stamp exists with this ID',
        },
        { status: 404 }
      )
    }

    // Get PE information
    const pe = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        peLicenseNumber: users.peLicenseNumber,
        peState: users.peState,
        email: users.email,
        isLicensedProfessional: users.isLicensedProfessional,
      })
      .from(users)
      .where(eq(users.id, stamp.userId))
      .get()

    // Get professional license details if available
    let license = null
    if (stamp.licenseId) {
      license = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.id, stamp.licenseId))
        .get()
    } else if (pe) {
      // Fall back to first license for user
      license = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.userId, stamp.userId))
        .get()
    }

    // Get associated document info
    let documentInfo = null
    if (stamp.documentHash) {
      const doc = await db
        .select({
          id: documents.id,
          title: documents.title,
          documentType: documents.documentType,
          filename: documents.filename,
          size: documents.size,
          discipline: documents.discipline,
        })
        .from(documents)
        .where(eq(documents.sha256Hash, stamp.documentHash))
        .get()

      if (doc) {
        documentInfo = doc
      }
    }

    // Get verification count
    const verifyCount = await db
      .select({ value: count() })
      .from(verificationLogs)
      .where(eq(verificationLogs.stampId, id))
      .get()

    // Build result
    const isValid = stamp.status === 'active'
    const isSuperseded = stamp.status === 'superseded'
    const result = isValid ? 'valid' : (stamp.status === 'revoked' ? 'revoked' : (isSuperseded ? 'superseded' : 'invalid'))

    // Log this verification
    await db.insert(verificationLogs).values({
      id: generateId(),
      stampId: id,
      verifiedAt: now,
      verificationMethod: 'web',
      result,
      createdAt: now,
    }).run().catch(err => console.warn('Log insert failed:', err))

    // Log to verification_scans for analytics
    const ipAddress = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || null
    const userAgent = req.headers.get('user-agent') || null
    const referrer = req.headers.get('referer') || null
    const scanSource = req.nextUrl.searchParams.get('source') || 'web'

    await db.insert(verificationScans).values({
      id: generateId(),
      stampId: id,
      scannedAt: now,
      ipAddress,
      userAgent,
      referrer,
      scanSource,
    }).run().catch(err => console.warn('Log insert failed:', err))

    // Parse insurance snapshot
    let insuranceInfo = null
    if (stamp.insuranceSnapshot) {
      try { insuranceInfo = JSON.parse(stamp.insuranceSnapshot) } catch (err) {
        console.warn(`Failed to parse insurance snapshot for stamp ${stamp.id}:`, err)
      }
    }

    // Smart alerts for license/insurance expiration
    const alerts: string[] = []
    if (license?.expirationDate && new Date(license.expirationDate) < now) {
      alerts.push('Professional license is expired')
    }
    if (insuranceInfo?.expirationDate && new Date(insuranceInfo.expirationDate) < now) {
      alerts.push('Insurance coverage was expired at stamp time')
    }

    // Build supersession info
    let supersession = null
    if (isSuperseded) {
      supersession = {
        supersededBy: stamp.supersededBy,
        supersededAt: stamp.supersededAt,
        reason: stamp.supersessionReason,
        newVersionUrl: stamp.supersededBy ? `/verify/${stamp.supersededBy}` : null,
      }
    }

    return NextResponse.json({
      valid: isValid,
      stamp: {
        id: stamp.id,
        status: stamp.status,
        documentHash: stamp.documentHash,
        jurisdictionId: stamp.jurisdictionId,
        projectName: stamp.projectName,
        permitNumber: stamp.permitNumber,
        notes: stamp.notes,
        scopeNotes: stamp.scopeNotes,
        createdAt: stamp.createdAt,
        revokedAt: stamp.revokedAt,
        revokedReason: stamp.revokedReason,
        documentFilename: stamp.documentFilename,
        documentSize: stamp.documentSize,
      },
      supersession,
      pe: pe
        ? {
            name: `${pe.firstName || ''} ${pe.lastName || ''}`.trim(),
            license: pe.peLicenseNumber
              ? `${pe.peState}-${pe.peLicenseNumber}`
              : null,
            state: pe.peState,
            isLicensedProfessional: pe.isLicensedProfessional,
          }
        : null,
      license: license
        ? {
            type: license.licenseType,
            number: license.licenseNumber,
            state: license.issuingState,
            issuingBody: license.issuingBody,
            disciplines: license.disciplines ? JSON.parse(license.disciplines) : [],
            status: license.status,
            expirationDate: license.expirationDate,
          }
        : null,
      insurance: insuranceInfo,
      document: documentInfo,
      blockchain: {
        id: stamp.blockchainId,
        txHash: stamp.txHash,
        verified: !!stamp.blockchainId,
      },
      verification: {
        totalVerifications: (verifyCount?.value || 0) + 1,
        verifiedAt: now.toISOString(),
        method: 'web',
      },
      alerts,
      message: isValid
        ? 'This stamp is valid and has not been revoked'
        : isSuperseded
          ? `This stamp has been superseded${stamp.supersessionReason ? `. Reason: ${stamp.supersessionReason}` : ''}${stamp.supersededBy ? '. A newer version is available.' : ''}`
          : stamp.status === 'revoked'
            ? `This stamp was revoked on ${stamp.revokedAt ? new Date(stamp.revokedAt).toLocaleDateString() : 'unknown date'}. Reason: ${stamp.revokedReason}`
            : 'This stamp is not valid',
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      {
        valid: false,
        error: 'Verification failed',
        message: 'An error occurred while verifying this stamp',
      },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'
