import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, stamps, users, professionalLicenses } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { getVerifyUrl } from '@/lib/qrcode'
import { submitToBlockchain } from '@/lib/blockchain'
import { autoSupersedePreviousStamps } from '@/lib/supersession'

// GET /api/stamps - List user's stamps
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

    const userStamps = await db
      .select()
      .from(stamps)
      .where(eq(stamps.userId, payload.userId))
      .orderBy(desc(stamps.createdAt))

    return NextResponse.json({ stamps: userStamps })
  } catch (error) {
    console.error('Get stamps error:', error)
    return NextResponse.json({ error: 'Failed to get stamps' }, { status: 500 })
  }
}

// POST /api/stamps - Create a new stamp
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
      documentHash,
      jurisdictionId,
      projectName,
      permitNumber,
      notes,
      documentFilename,
      documentSize,
      scopeNotes,
      licenseId: requestedLicenseId,
    } = body

    // Validation
    if (!documentHash || !/^[a-f0-9]{64}$/i.test(documentHash)) {
      return NextResponse.json(
        { error: 'Invalid document hash (must be 64 hex characters)' },
        { status: 400 }
      )
    }

    if (!jurisdictionId) {
      return NextResponse.json(
        { error: 'Jurisdiction is required' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Get user for PE info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .get()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create stamp
    const stampId = generateId()
    const now = new Date()

    const verifyUrl = getVerifyUrl(stampId)

    // Submit to blockchain (local anchor or chain RPC)
    const chainResult = await submitToBlockchain({
      stampId,
      documentHash,
      userId: payload.userId,
      jurisdictionId,
      projectName,
    })
    const blockchainId = chainResult.blockchainId

    // Capture insurance snapshot from user's license at stamp time
    // Prefer specific license if provided, otherwise fall back to user's first license
    let insuranceSnapshot: string | null = null
    let matchedLicenseId: string | null = null

    let userLicense = null
    if (requestedLicenseId) {
      userLicense = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.id, requestedLicenseId))
        .get()
      // Verify the license belongs to this user
      if (userLicense && userLicense.userId !== payload.userId) {
        userLicense = null
      }
    }
    if (!userLicense) {
      userLicense = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.userId, payload.userId))
        .get()
    }

    if (userLicense) {
      matchedLicenseId = userLicense.id
      if (userLicense.insuranceProvider) {
        insuranceSnapshot = JSON.stringify({
          provider: userLicense.insuranceProvider,
          policyNumber: userLicense.insurancePolicyNumber,
          coverageAmount: userLicense.insuranceCoverageAmount,
          expirationDate: userLicense.insuranceExpirationDate,
          capturedAt: now.toISOString(),
        })
      }
    }

    await db.insert(stamps).values({
      id: stampId,
      blockchainId,
      txHash: chainResult.txHash,
      documentHash,
      jurisdictionId,
      projectName: projectName || null,
      permitNumber: permitNumber || null,
      notes: notes || null,
      documentFilename: documentFilename || null,
      documentSize: documentSize || null,
      status: 'active',
      scopeNotes: scopeNotes || null,
      insuranceSnapshot,
      licenseId: matchedLicenseId,
      qrCodeDataUrl: null,
      verifyUrl,
      createdAt: now,
      userId: payload.userId,
    })

    // Auto-supersede previous active stamps for this project
    const superseded = await autoSupersedePreviousStamps(
      db, payload.userId, stampId, projectName
    )

    // Fetch the created stamp
    const newStamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, stampId))
      .get()

    return NextResponse.json({
      stamp: newStamp,
      verifyUrl,
      supersededCount: superseded.supersededCount,
      supersededIds: superseded.supersededIds,
    })
  } catch (error) {
    console.error('Create stamp error:', error)
    return NextResponse.json({ error: 'Failed to create stamp' }, { status: 500 })
  }
}
export const runtime = 'edge'
