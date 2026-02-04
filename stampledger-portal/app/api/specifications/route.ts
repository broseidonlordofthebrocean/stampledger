import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { createDb, specifications, specRevisions, orgMemberships } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

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

// GET /api/specifications - List specifications for an org
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

    const specsList = await db
      .select()
      .from(specifications)
      .where(eq(specifications.orgId, orgId))
      .orderBy(desc(specifications.createdAt))

    return NextResponse.json({ specifications: specsList })
  } catch (error) {
    console.error('Get specifications error:', error)
    return NextResponse.json({ error: 'Failed to get specifications' }, { status: 500 })
  }
}

// POST /api/specifications - Create a new master specification
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
    const { orgId, title, specNumber, discipline, description } = body

    if (!orgId || !title || !specNumber) {
      return NextResponse.json(
        { error: 'Organization ID, title, and spec number are required' },
        { status: 400 }
      )
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Check user has permission to create specs
    const membership = await checkOrgAccess(db, payload.userId, orgId)
    if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if spec number already exists in this org
    const existingSpec = await db
      .select()
      .from(specifications)
      .where(
        and(
          eq(specifications.orgId, orgId),
          eq(specifications.specNumber, specNumber)
        )
      )
      .get()

    if (existingSpec) {
      return NextResponse.json(
        { error: 'Specification number already exists in this organization' },
        { status: 409 }
      )
    }

    const specId = generateId()
    const now = new Date()

    await db.insert(specifications).values({
      id: specId,
      orgId,
      title,
      specNumber,
      discipline: discipline || null,
      description: description || null,
      currentRevision: '0',
      status: 'draft',
      ownerUserId: payload.userId,
      createdAt: now,
      updatedAt: now,
    })

    const newSpec = await db
      .select()
      .from(specifications)
      .where(eq(specifications.id, specId))
      .get()

    return NextResponse.json({ specification: newSpec })
  } catch (error) {
    console.error('Create specification error:', error)
    return NextResponse.json({ error: 'Failed to create specification' }, { status: 500 })
  }
}
