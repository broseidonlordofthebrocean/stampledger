import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, stamps, users, professionalLicenses } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/admin/municipality/stamps - All stamps with compliance data
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

    // Check admin
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const now = new Date()

    // Get all stamps with PE info
    const allStamps = await db
      .select({
        id: stamps.id,
        status: stamps.status,
        projectName: stamps.projectName,
        jurisdictionId: stamps.jurisdictionId,
        documentHash: stamps.documentHash,
        createdAt: stamps.createdAt,
        scopeNotes: stamps.scopeNotes,
        insuranceSnapshot: stamps.insuranceSnapshot,
        licenseId: stamps.licenseId,
        userId: stamps.userId,
      })
      .from(stamps)
      .orderBy(desc(stamps.createdAt))
      .limit(500)

    const alerts: { type: string; message: string; stampId: string }[] = []
    const enriched = []

    for (const stamp of allStamps) {
      // Get PE name
      const pe = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, stamp.userId))
        .get()

      const peName = pe ? `${pe.firstName || ''} ${pe.lastName || ''}`.trim() : 'Unknown'

      // Get license info
      let license = null
      if (stamp.licenseId) {
        license = await db
          .select()
          .from(professionalLicenses)
          .where(eq(professionalLicenses.id, stamp.licenseId))
          .get()
      } else {
        license = await db
          .select()
          .from(professionalLicenses)
          .where(eq(professionalLicenses.userId, stamp.userId))
          .get()
      }

      const licenseExpired = license?.expirationDate
        ? new Date(license.expirationDate) < now
        : false

      // Check insurance from snapshot
      let insuranceExpired = false
      if (stamp.insuranceSnapshot) {
        try {
          const ins = JSON.parse(stamp.insuranceSnapshot)
          if (ins.expirationDate && new Date(ins.expirationDate) < now) {
            insuranceExpired = true
          }
        } catch {}
      }

      // Generate alerts for active stamps with issues
      if (stamp.status === 'active') {
        if (licenseExpired) {
          alerts.push({
            type: 'license_expired',
            message: `License expired for ${peName} on stamp "${stamp.projectName || stamp.id}"`,
            stampId: stamp.id,
          })
        }
        if (insuranceExpired) {
          alerts.push({
            type: 'insurance_expired',
            message: `Insurance expired for ${peName} on stamp "${stamp.projectName || stamp.id}"`,
            stampId: stamp.id,
          })
        }
      }

      enriched.push({
        id: stamp.id,
        status: stamp.status,
        projectName: stamp.projectName,
        jurisdictionId: stamp.jurisdictionId,
        documentHash: stamp.documentHash,
        createdAt: stamp.createdAt,
        peName,
        licenseNumber: license?.licenseNumber || null,
        licenseExpired,
        insuranceExpired,
        scopeNotes: stamp.scopeNotes,
      })
    }

    return NextResponse.json({ stamps: enriched, alerts })
  } catch (error) {
    console.error('Municipality stamps error:', error)
    return NextResponse.json({ error: 'Failed to fetch municipality data' }, { status: 500 })
  }
}
export const runtime = 'edge'
