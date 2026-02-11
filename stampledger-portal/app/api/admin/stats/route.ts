import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, users, organizations, stamps, professionalLicenses, verificationLogs } from '@/lib/db'
import { eq, sql, desc } from 'drizzle-orm'

// GET /api/admin/stats - Platform-wide statistics
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const db = getDb()

    // Check admin
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Count users
    const userCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .get()

    // Count orgs
    const orgCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations)
      .get()

    // Count stamps
    const stampCounts = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${stamps.status} = 'active' then 1 else 0 end)`,
        revoked: sql<number>`sum(case when ${stamps.status} = 'revoked' then 1 else 0 end)`,
      })
      .from(stamps)
      .get()

    // Count licenses by status
    const licenseCounts = await db
      .select({
        total: sql<number>`count(*)`,
        pending: sql<number>`sum(case when ${professionalLicenses.status} = 'pending_verification' then 1 else 0 end)`,
        active: sql<number>`sum(case when ${professionalLicenses.status} = 'active' then 1 else 0 end)`,
        expired: sql<number>`sum(case when ${professionalLicenses.status} = 'expired' then 1 else 0 end)`,
      })
      .from(professionalLicenses)
      .get()

    // Count verifications
    const verifyCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(verificationLogs)
      .get()

    // Recent signups (last 10)
    const recentUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10)

    return NextResponse.json({
      users: { total: userCount?.count || 0 },
      organizations: { total: orgCount?.count || 0 },
      stamps: {
        total: stampCounts?.total || 0,
        active: stampCounts?.active || 0,
        revoked: stampCounts?.revoked || 0,
      },
      licenses: {
        total: licenseCounts?.total || 0,
        pending: licenseCounts?.pending || 0,
        active: licenseCounts?.active || 0,
        expired: licenseCounts?.expired || 0,
      },
      verifications: { total: verifyCount?.count || 0 },
      recentUsers,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
export const runtime = 'edge'
