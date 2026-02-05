import { NextRequest, NextResponse } from 'next/server'
import { createDb, stamps, users } from '@/lib/db'
import { eq } from 'drizzle-orm'

// GET /api/verify/[id] - Public verification endpoint (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Find stamp
    const stamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, id))
      .get()

    if (!stamp) {
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
      })
      .from(users)
      .where(eq(users.id, stamp.userId))
      .get()

    // Build response
    const isValid = stamp.status === 'active'

    return NextResponse.json({
      valid: isValid,
      stamp: {
        id: stamp.id,
        status: stamp.status,
        documentHash: stamp.documentHash,
        jurisdictionId: stamp.jurisdictionId,
        projectName: stamp.projectName,
        permitNumber: stamp.permitNumber,
        createdAt: stamp.createdAt,
        revokedAt: stamp.revokedAt,
        revokedReason: stamp.revokedReason,
      },
      pe: pe
        ? {
            name: `${pe.firstName || ''} ${pe.lastName || ''}`.trim(),
            license: pe.peLicenseNumber
              ? `${pe.peState}-${pe.peLicenseNumber}`
              : null,
            state: pe.peState,
          }
        : null,
      blockchain: {
        id: stamp.blockchainId,
        verified: true, // TODO: Actually verify on blockchain
      },
      message: isValid
        ? 'This stamp is valid and has not been revoked'
        : `This stamp was revoked on ${new Date(stamp.revokedAt!).toLocaleDateString()}. Reason: ${stamp.revokedReason}`,
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
