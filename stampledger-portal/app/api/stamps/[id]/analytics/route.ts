import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { getDb, stamps, verificationScans } from '@/lib/db'
import { eq, and, gte, desc, count } from 'drizzle-orm'

// GET /api/stamps/[id]/analytics - Get verification scan analytics for a stamp
export async function GET(
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

    const db = getDb()

    // Verify ownership
    const stamp = await db
      .select()
      .from(stamps)
      .where(
        and(
          eq(stamps.id, id),
          eq(stamps.userId, payload.userId)
        )
      )
      .get()

    if (!stamp) {
      return NextResponse.json({ error: 'Stamp not found' }, { status: 404 })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Total scans
    const totalResult = await db
      .select({ value: count() })
      .from(verificationScans)
      .where(eq(verificationScans.stampId, id))
      .get()

    // Last 7 days
    const last7dResult = await db
      .select({ value: count() })
      .from(verificationScans)
      .where(
        and(
          eq(verificationScans.stampId, id),
          gte(verificationScans.scannedAt, sevenDaysAgo)
        )
      )
      .get()

    // Last 30 days
    const last30dResult = await db
      .select({ value: count() })
      .from(verificationScans)
      .where(
        and(
          eq(verificationScans.stampId, id),
          gte(verificationScans.scannedAt, thirtyDaysAgo)
        )
      )
      .get()

    // Recent scans (last 20)
    const recentScans = await db
      .select({
        id: verificationScans.id,
        scannedAt: verificationScans.scannedAt,
        scanSource: verificationScans.scanSource,
        referrer: verificationScans.referrer,
      })
      .from(verificationScans)
      .where(eq(verificationScans.stampId, id))
      .orderBy(desc(verificationScans.scannedAt))
      .limit(20)

    return NextResponse.json({
      total: totalResult?.value || 0,
      last7d: last7dResult?.value || 0,
      last30d: last30dResult?.value || 0,
      recentScans,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 })
  }
}
export const runtime = 'edge'
