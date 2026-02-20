import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, users, orgMemberships, professionalLicenses, stamps } from '@/lib/db'
import { eq, sql, desc, like, or, inArray } from 'drizzle-orm'

// GET /api/admin/users - List all users (paginated, searchable)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const db = getDb()

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    // Build query
    let allUsers
    let totalCount

    if (search) {
      const searchPattern = `%${search}%`
      allUsers = await db
        .select()
        .from(users)
        .where(
          or(
            like(users.email, searchPattern),
            like(users.firstName, searchPattern),
            like(users.lastName, searchPattern)
          )
        )
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          or(
            like(users.email, searchPattern),
            like(users.firstName, searchPattern),
            like(users.lastName, searchPattern)
          )
        )
        .get()
      totalCount = countResult?.count || 0
    } else {
      allUsers = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .get()
      totalCount = countResult?.count || 0
    }

    // Batch fetch counts for all users on this page
    const userIds = allUsers.map(u => u.id)

    const orgCountMap = new Map<string, number>()
    const licenseCountMap = new Map<string, number>()
    const stampCountMap = new Map<string, number>()

    if (userIds.length > 0) {
      const orgCounts = await db
        .select({ userId: orgMemberships.userId, count: sql<number>`count(*)` })
        .from(orgMemberships)
        .where(inArray(orgMemberships.userId, userIds))
        .groupBy(orgMemberships.userId)
      for (const row of orgCounts) orgCountMap.set(row.userId, row.count)

      const licenseCounts = await db
        .select({ userId: professionalLicenses.userId, count: sql<number>`count(*)` })
        .from(professionalLicenses)
        .where(inArray(professionalLicenses.userId, userIds))
        .groupBy(professionalLicenses.userId)
      for (const row of licenseCounts) licenseCountMap.set(row.userId, row.count)

      const stampCounts = await db
        .select({ userId: stamps.userId, count: sql<number>`count(*)` })
        .from(stamps)
        .where(inArray(stamps.userId, userIds))
        .groupBy(stamps.userId)
      for (const row of stampCounts) stampCountMap.set(row.userId, row.count)
    }

    const enriched = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      isLicensedProfessional: u.isLicensedProfessional,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      orgCount: orgCountMap.get(u.id) || 0,
      licenseCount: licenseCountMap.get(u.id) || 0,
      stampCount: stampCountMap.get(u.id) || 0,
    }))

    return NextResponse.json({
      users: enriched,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 })
  }
}
export const runtime = 'edge'
