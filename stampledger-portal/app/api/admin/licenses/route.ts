import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, users, professionalLicenses } from '@/lib/db'
import { eq, sql, desc } from 'drizzle-orm'

// GET /api/admin/licenses - List all licenses (paginated, filterable by status)
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
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = (page - 1) * limit

    let allLicenses
    let totalCount

    if (status) {
      allLicenses = await db
        .select({
          license: professionalLicenses,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
        })
        .from(professionalLicenses)
        .innerJoin(users, eq(professionalLicenses.userId, users.id))
        .where(eq(professionalLicenses.status, status))
        .orderBy(desc(professionalLicenses.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(professionalLicenses)
        .where(eq(professionalLicenses.status, status))
        .get()
      totalCount = countResult?.count || 0
    } else {
      allLicenses = await db
        .select({
          license: professionalLicenses,
          userEmail: users.email,
          userFirstName: users.firstName,
          userLastName: users.lastName,
        })
        .from(professionalLicenses)
        .innerJoin(users, eq(professionalLicenses.userId, users.id))
        .orderBy(desc(professionalLicenses.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(professionalLicenses)
        .get()
      totalCount = countResult?.count || 0
    }

    const result = allLicenses.map((row) => ({
      ...row.license,
      disciplines: row.license.disciplines ? JSON.parse(row.license.disciplines) : [],
      userName: `${row.userFirstName} ${row.userLastName}`.trim(),
      userEmail: row.userEmail,
    }))

    return NextResponse.json({
      licenses: result,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Admin licenses error:', error)
    return NextResponse.json({ error: 'Failed to get licenses' }, { status: 500 })
  }
}
export const runtime = 'edge'
