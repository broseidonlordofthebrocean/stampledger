import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, stamps, users } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { generateStampQR, getVerifyUrl } from '@/lib/qrcode'

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
    } = body

    // Validation
    if (!documentHash || documentHash.length !== 64) {
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

    // Generate QR code
    const qrCodeDataUrl = await generateStampQR(stampId)
    const verifyUrl = getVerifyUrl(stampId)

    // TODO: Submit to blockchain
    // For now, we'll store locally and add blockchain integration later
    const blockchainId = `local-${stampId}` // Placeholder

    await db.insert(stamps).values({
      id: stampId,
      blockchainId,
      documentHash,
      jurisdictionId,
      projectName: projectName || null,
      permitNumber: permitNumber || null,
      notes: notes || null,
      documentFilename: documentFilename || null,
      documentSize: documentSize || null,
      status: 'active',
      qrCodeDataUrl,
      verifyUrl,
      createdAt: now,
      userId: payload.userId,
    })

    // Fetch the created stamp
    const newStamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, stampId))
      .get()

    return NextResponse.json({
      stamp: newStamp,
      qrCode: qrCodeDataUrl,
      verifyUrl,
    })
  } catch (error) {
    console.error('Create stamp error:', error)
    return NextResponse.json({ error: 'Failed to create stamp' }, { status: 500 })
  }
}
export const runtime = 'edge'
