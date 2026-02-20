import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, stamps, users, professionalLicenses } from '@/lib/db'
import { eq, desc, inArray } from 'drizzle-orm'

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

    // Get all stamps
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

    // Batch: collect unique user IDs and license IDs
    const userIds = [...new Set(allStamps.map(s => s.userId))]
    const licenseIds = [...new Set(allStamps.map(s => s.licenseId).filter(Boolean))] as string[]

    // Batch fetch all users at once
    const userMap = new Map<string, { firstName: string | null; lastName: string | null }>()
    if (userIds.length > 0) {
      const allUsers = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, userIds))
      for (const u of allUsers) {
        userMap.set(u.id, { firstName: u.firstName, lastName: u.lastName })
      }
    }

    // Batch fetch all licenses at once (by ID + by userId for stamps missing licenseId)
    const licenseByIdMap = new Map<string, typeof professionalLicenses.$inferSelect>()
    const licenseByUserMap = new Map<string, typeof professionalLicenses.$inferSelect>()

    if (licenseIds.length > 0) {
      const licensesById = await db
        .select()
        .from(professionalLicenses)
        .where(inArray(professionalLicenses.id, licenseIds))
      for (const l of licensesById) {
        licenseByIdMap.set(l.id, l)
      }
    }

    // For stamps without licenseId, fetch licenses by userId
    const userIdsWithoutLicenseId = [...new Set(
      allStamps.filter(s => !s.licenseId).map(s => s.userId)
    )]
    if (userIdsWithoutLicenseId.length > 0) {
      const licensesByUser = await db
        .select()
        .from(professionalLicenses)
        .where(inArray(professionalLicenses.userId, userIdsWithoutLicenseId))
      for (const l of licensesByUser) {
        // Only keep the first license per user (matching old behavior)
        if (!licenseByUserMap.has(l.userId)) {
          licenseByUserMap.set(l.userId, l)
        }
      }
    }

    const alerts: { type: string; message: string; stampId: string }[] = []
    const enriched = []

    for (const stamp of allStamps) {
      const pe = userMap.get(stamp.userId)
      const peName = pe ? `${pe.firstName || ''} ${pe.lastName || ''}`.trim() : 'Unknown'

      const license = stamp.licenseId
        ? licenseByIdMap.get(stamp.licenseId) || null
        : licenseByUserMap.get(stamp.userId) || null

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
        } catch (err) {
          console.warn(`Failed to parse insurance snapshot for stamp ${stamp.id}:`, err)
        }
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
