import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { createDb, projects, programs, orgMemberships, projectSpecifications, changeNotifications } from '@/lib/db'
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

// GET /api/projects - List projects for an org (via query param orgId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')
    const programId = searchParams.get('programId')

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

    let query = db.select().from(projects).where(eq(projects.orgId, orgId))

    if (programId) {
      query = db
        .select()
        .from(projects)
        .where(and(eq(projects.orgId, orgId), eq(projects.programId, programId)))
    }

    const projectsList = await query.orderBy(desc(projects.createdAt))

    return NextResponse.json({ projects: projectsList })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({ error: 'Failed to get projects' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
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
      orgId,
      name,
      projectNumber,
      description,
      locationAddress,
      locationLat,
      locationLng,
      programId,
      clientOrgId,
    } = body

    if (!orgId || !name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Check user has permission to create projects (owner, admin, manager)
    const membership = await checkOrgAccess(db, payload.userId, orgId)
    if (!membership || !['owner', 'admin', 'manager'].includes(membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const projectId = generateId()
    const now = new Date()

    await db.insert(projects).values({
      id: projectId,
      orgId,
      name,
      projectNumber: projectNumber || null,
      description: description || null,
      locationAddress: locationAddress || null,
      locationLat: locationLat || null,
      locationLng: locationLng || null,
      status: 'active',
      programId: programId || null,
      clientOrgId: clientOrgId || null,
      createdBy: payload.userId,
      createdAt: now,
      updatedAt: now,
    })

    // Update program project count if assigned to a program
    if (programId) {
      await db
        .update(programs)
        .set({
          projectCount: sql`${programs.projectCount} + 1`,
        })
        .where(eq(programs.id, programId))
    }

    const newProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get()

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
