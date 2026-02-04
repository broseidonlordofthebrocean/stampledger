import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { createDb, programs, projects, orgMemberships } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'

// Helper to check org membership
async function checkOrgAccess(db: any, userId: string, orgId: string) {
  const membership = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.status, 'active')
      )
    )
    .get()

  return membership
}

// GET /api/programs - List programs for an org (via query param orgId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'orgId query param required' }, { status: 400 })
    }

    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Check user has access to this org
    const membership = await checkOrgAccess(db, payload.userId, orgId)
    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const programsList = await db
      .select()
      .from(programs)
      .where(eq(programs.orgId, orgId))
      .orderBy(desc(programs.createdAt))

    return NextResponse.json({ programs: programsList })
  } catch (error) {
    console.error('Get programs error:', error)
    return NextResponse.json({ error: 'Failed to get programs' }, { status: 500 })
  }
}

// POST /api/programs - Create a new program
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
    const { orgId, name, description } = body

    if (!orgId || !name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Check user has permission to create programs (owner, admin, manager)
    const membership = await checkOrgAccess(db, payload.userId, orgId)
    if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const programId = generateId()
    const now = new Date()

    await db.insert(programs).values({
      id: programId,
      orgId,
      name,
      description: description || null,
      projectCount: 0,
      status: 'active',
      createdAt: now,
    })

    const newProgram = await db
      .select()
      .from(programs)
      .where(eq(programs.id, programId))
      .get()

    return NextResponse.json({ program: newProgram })
  } catch (error) {
    console.error('Create program error:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
