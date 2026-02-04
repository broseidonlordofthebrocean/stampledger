import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { createDb, projects, programs, orgMemberships, projectSpecifications, specifications, changeNotifications, users } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'

// Helper to check project access
async function checkProjectAccess(db: any, userId: string, projectId: string) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .get()

  if (!project) return null

  const membership = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, project.orgId),
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.status, 'active')
      )
    )
    .get()

  if (!membership) return null

  return { project, membership }
}

// GET /api/projects/[id] - Get project details with spec compliance
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

    // @ts-ignore
    const db = createDb(process.env.DB)

    const access = await checkProjectAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get spec compliance status
    const specs = await db
      .select({
        link: projectSpecifications,
        spec: specifications,
      })
      .from(projectSpecifications)
      .innerJoin(specifications, eq(projectSpecifications.specId, specifications.id))
      .where(eq(projectSpecifications.projectId, id))

    const specCompliance = specs.map((s) => ({
      specId: s.spec.id,
      specNumber: s.spec.specNumber,
      specTitle: s.spec.title,
      currentAppliedRevision: s.link.currentAppliedRevision,
      latestAvailableRevision: s.link.latestAvailableRevision,
      isCurrent: s.link.currentAppliedRevision === s.link.latestAvailableRevision,
    }))

    // Get pending change notifications
    const notifications = await db
      .select({
        notification: changeNotifications,
        spec: specifications,
        assignedUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(changeNotifications)
      .innerJoin(specifications, eq(changeNotifications.specId, specifications.id))
      .leftJoin(users, eq(changeNotifications.assignedTo, users.id))
      .where(
        and(
          eq(changeNotifications.projectId, id),
          eq(changeNotifications.status, 'pending')
        )
      )

    const pendingNotifications = notifications.map((n) => ({
      id: n.notification.id,
      specNumber: n.spec.specNumber,
      specTitle: n.spec.title,
      fromRevision: n.notification.fromRevision,
      toRevision: n.notification.toRevision,
      status: n.notification.status,
      assignedTo: n.assignedUser
        ? `${n.assignedUser.firstName} ${n.assignedUser.lastName}`
        : null,
    }))

    return NextResponse.json({
      project: access.project,
      role: access.membership.role,
      specCompliance,
      pendingNotifications,
    })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({ error: 'Failed to get project' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
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

    // @ts-ignore
    const db = createDb(process.env.DB)

    const access = await checkProjectAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only owner, admin, manager can update projects
    if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      projectNumber,
      description,
      locationAddress,
      locationLat,
      locationLng,
      status,
      programId,
    } = body

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (projectNumber !== undefined) updates.projectNumber = projectNumber
    if (description !== undefined) updates.description = description
    if (locationAddress !== undefined) updates.locationAddress = locationAddress
    if (locationLat !== undefined) updates.locationLat = locationLat
    if (locationLng !== undefined) updates.locationLng = locationLng
    if (status !== undefined) updates.status = status

    // Handle program change
    if (programId !== undefined && programId !== access.project.programId) {
      // Decrement old program count
      if (access.project.programId) {
        await db
          .update(programs)
          .set({ projectCount: sql`${programs.projectCount} - 1` })
          .where(eq(programs.id, access.project.programId))
      }
      // Increment new program count
      if (programId) {
        await db
          .update(programs)
          .set({ projectCount: sql`${programs.projectCount} + 1` })
          .where(eq(programs.id, programId))
      }
      updates.programId = programId
    }

    await db.update(projects).set(updates).where(eq(projects.id, id))

    const updatedProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .get()

    return NextResponse.json({ project: updatedProject })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
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

    // @ts-ignore
    const db = createDb(process.env.DB)

    const access = await checkProjectAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only owner, admin can delete projects
    if (!['owner', 'admin'].includes(access.membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update program count if in a program
    if (access.project.programId) {
      await db
        .update(programs)
        .set({ projectCount: sql`${programs.projectCount} - 1` })
        .where(eq(programs.id, access.project.programId))
    }

    await db.delete(projects).where(eq(projects.id, id))

    return NextResponse.json({ message: 'Project deleted' })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
