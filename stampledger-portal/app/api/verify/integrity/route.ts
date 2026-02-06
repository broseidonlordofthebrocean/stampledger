import { NextRequest, NextResponse } from 'next/server'
import { getDb, stamps, users, documents } from '@/lib/db'
import { eq } from 'drizzle-orm'

// POST /api/verify/integrity - Check if a document hash matches any stamp
// No auth required (public verification)
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    let sha256Hash: string

    if (contentType.includes('multipart/form-data')) {
      // File upload: compute hash server-side
      const formData = await req.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        )
      }

      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
      // JSON body with pre-computed hash
      const body = await req.json()
      sha256Hash = body.sha256Hash

      if (!sha256Hash || typeof sha256Hash !== 'string') {
        return NextResponse.json(
          { error: 'sha256Hash is required' },
          { status: 400 }
        )
      }
    }

    sha256Hash = sha256Hash.toLowerCase()

    const db = getDb()

    // Find stamps matching this document hash
    const matchingStamps = await db
      .select({
        id: stamps.id,
        status: stamps.status,
        projectName: stamps.projectName,
        jurisdictionId: stamps.jurisdictionId,
        permitNumber: stamps.permitNumber,
        createdAt: stamps.createdAt,
        userId: stamps.userId,
        blockchainId: stamps.blockchainId,
      })
      .from(stamps)
      .where(eq(stamps.documentHash, sha256Hash))
      .all()

    if (matchingStamps.length === 0) {
      // Also check documents table
      const matchingDoc = await db
        .select({
          id: documents.id,
          title: documents.title,
          documentType: documents.documentType,
          status: documents.status,
        })
        .from(documents)
        .where(eq(documents.sha256Hash, sha256Hash))
        .get()

      return NextResponse.json({
        match: false,
        documentHash: sha256Hash,
        stamps: [],
        document: matchingDoc || null,
        message: matchingDoc
          ? 'Document found in records but no stamps associated'
          : 'No stamps or documents found matching this hash',
      })
    }

    // Enrich with PE info
    const enrichedStamps = await Promise.all(
      matchingStamps.map(async (stamp) => {
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

        return {
          id: stamp.id,
          status: stamp.status,
          projectName: stamp.projectName,
          jurisdictionId: stamp.jurisdictionId,
          permitNumber: stamp.permitNumber,
          createdAt: stamp.createdAt,
          blockchainId: stamp.blockchainId,
          pe: pe
            ? {
                name: `${pe.firstName || ''} ${pe.lastName || ''}`.trim(),
                license: pe.peLicenseNumber ? `${pe.peState}-${pe.peLicenseNumber}` : null,
              }
            : null,
        }
      })
    )

    const activeStamps = enrichedStamps.filter(s => s.status === 'active')

    return NextResponse.json({
      match: true,
      documentHash: sha256Hash,
      stamps: enrichedStamps,
      activeCount: activeStamps.length,
      totalCount: enrichedStamps.length,
      message: activeStamps.length > 0
        ? `Document verified: ${activeStamps.length} active stamp(s) found`
        : 'Document found but all associated stamps have been revoked',
    })
  } catch (error) {
    console.error('Integrity check error:', error)
    return NextResponse.json(
      { error: 'Integrity check failed' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'
