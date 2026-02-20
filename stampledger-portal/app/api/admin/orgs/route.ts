import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, users, organizations, orgMemberships, stamps } from '@/lib/db'
import { eq, sql, desc, like, or, inArray } from 'drizzle-orm'

// GET /api/admin/orgs - List all organizations (paginated, searchable)
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

    let allOrgs
    let totalCount

    if (search) {
      const searchPattern = `%${search}%`
      allOrgs = await db
        .select()
        .from(organizations)
        .where(
          or(
            like(organizations.name, searchPattern),
            like(organizations.slug, searchPattern)
          )
        )
        .orderBy(desc(organizations.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizations)
        .where(
          or(
            like(organizations.name, searchPattern),
            like(organizations.slug, searchPattern)
          )
        )
        .get()
      totalCount = countResult?.count || 0
    } else {
      allOrgs = await db
        .select()
        .from(organizations)
        .orderBy(desc(organizations.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizations)
        .get()
      totalCount = countResult?.count || 0
    }

    // Batch fetch counts for all orgs on this page
    const orgIds = allOrgs.map(o => o.id)

    const memberCountMap = new Map<string, number>()
    const stampCountMap = new Map<string, number>()

    if (orgIds.length > 0) {
      const memberCounts = await db
        .select({ orgId: orgMemberships.orgId, count: sql<number>`count(*)` })
        .from(orgMemberships)
        .where(inArray(orgMemberships.orgId, orgIds))
        .groupBy(orgMemberships.orgId)
      for (const row of memberCounts) memberCountMap.set(row.orgId, row.count)

      const stampCounts = await db
        .select({ orgId: stamps.orgId, count: sql<number>`count(*)` })
        .from(stamps)
        .where(inArray(stamps.orgId, orgIds))
        .groupBy(stamps.orgId)
      for (const row of stampCounts) stampCountMap.set(row.orgId!, row.count)
    }

    const enriched = allOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      orgType: org.orgType,
      plan: org.plan,
      city: org.city,
      state: org.state,
      createdAt: org.createdAt,
      memberCount: memberCountMap.get(org.id) || 0,
      stampCount: stampCountMap.get(org.id) || 0,
    }))

    return NextResponse.json({
      organizations: enriched,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Admin orgs error:', error)
    return NextResponse.json({ error: 'Failed to get organizations' }, { status: 500 })
  }
}
export const runtime = 'edge'
