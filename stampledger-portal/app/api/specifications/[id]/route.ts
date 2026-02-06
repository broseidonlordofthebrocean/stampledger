import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, specifications, specRevisions, specChanges, projectSpecifications, changeNotifications, orgMemberships, projects } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

// Helper to check spec access
async function checkSpecAccess(db: any, userId: string, specId: string) {
  const spec = await db
    .select()
    .from(specifications)
    .where(eq(specifications.id, specId))
    .get()

  if (!spec) return null

  const membership = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, spec.orgId),
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.status, 'active')
      )
    )
    .get()

  if (!membership) return null

  return { spec, membership }
}

// GET /api/specifications/[id] - Get specification with revisions and changes
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

    const db = getDb()

    const access = await checkSpecAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 })
    }

    // Get all revisions
    const revisions = await db
      .select()
      .from(specRevisions)
      .where(eq(specRevisions.specId, id))
      .orderBy(desc(specRevisions.createdAt))

    // Get changes for each revision
    const revisionsWithChanges = await Promise.all(
      revisions.map(async (rev) => {
        const changes = await db
          .select()
          .from(specChanges)
          .where(eq(specChanges.specRevisionId, rev.id))
          .orderBy(specChanges.changeNumber)

        return { ...rev, changes }
      })
    )

    // Get projects using this spec
    const linkedProjects = await db
      .select({
        link: projectSpecifications,
        project: projects,
      })
      .from(projectSpecifications)
      .innerJoin(projects, eq(projectSpecifications.projectId, projects.id))
      .where(eq(projectSpecifications.specId, id))

    const projectsWithCompliance = linkedProjects.map((p) => ({
      projectId: p.project.id,
      projectName: p.project.name,
      projectNumber: p.project.projectNumber,
      currentAppliedRevision: p.link.currentAppliedRevision,
      latestAvailableRevision: p.link.latestAvailableRevision,
      isCurrent: p.link.currentAppliedRevision === p.link.latestAvailableRevision,
    }))

    return NextResponse.json({
      specification: access.spec,
      revisions: revisionsWithChanges,
      linkedProjects: projectsWithCompliance,
      role: access.membership.role,
    })
  } catch (error) {
    console.error('Get specification error:', error)
    return NextResponse.json({ error: 'Failed to get specification' }, { status: 500 })
  }
}

// POST /api/specifications/[id] - Publish a new revision (creates notifications)
export async function POST(
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

    const body = await req.json()
    const { revisionNumber, revisionLabel, changes } = body

    if (!revisionNumber) {
      return NextResponse.json({ error: 'Revision number is required' }, { status: 400 })
    }

    const db = getDb()

    const access = await checkSpecAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 })
    }

    // Only owner, admin, manager can publish revisions
    if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const now = new Date()
    const revisionId = generateId()

    // Create the revision
    await db.insert(specRevisions).values({
      id: revisionId,
      specId: id,
      revisionNumber,
      revisionLabel: revisionLabel || null,
      status: 'published',
      publishedAt: now,
      publishedBy: payload.userId,
      createdAt: now,
    })

    // Add individual changes
    if (changes && Array.isArray(changes)) {
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i]
        await db.insert(specChanges).values({
          id: generateId(),
          specRevisionId: revisionId,
          changeNumber: i + 1,
          title: change.title,
          description: change.description,
          sectionReference: change.sectionReference || null,
          changeType: change.changeType || 'modification',
          priority: change.priority || 'normal',
          affectsCost: change.affectsCost || false,
          affectsSchedule: change.affectsSchedule || false,
          estimatedCostImpact: change.estimatedCostImpact || null,
          initiatedBy: change.initiatedBy || null,
          createdAt: now,
        })
      }
    }

    // Update spec's current revision
    await db
      .update(specifications)
      .set({
        currentRevision: revisionNumber,
        status: 'active',
        updatedAt: now,
      })
      .where(eq(specifications.id, id))

    // Get all projects linked to this spec
    const linkedProjects = await db
      .select()
      .from(projectSpecifications)
      .where(eq(projectSpecifications.specId, id))

    // Update latestAvailableRevision and create notifications
    for (const link of linkedProjects) {
      const previousRevision = link.latestAvailableRevision || link.currentAppliedRevision

      // Update the link
      await db
        .update(projectSpecifications)
        .set({
          latestAvailableRevision: revisionNumber,
          updatedAt: now,
        })
        .where(eq(projectSpecifications.id, link.id))

      // Create notification if project isn't already on the new revision
      if (link.currentAppliedRevision !== revisionNumber) {
        await db.insert(changeNotifications).values({
          id: generateId(),
          projectId: link.projectId,
          specId: id,
          specRevisionId: revisionId,
          fromRevision: previousRevision,
          toRevision: revisionNumber,
          status: 'pending',
          createdAt: now,
        })
      }
    }

    // Get the new revision with changes
    const newRevision = await db
      .select()
      .from(specRevisions)
      .where(eq(specRevisions.id, revisionId))
      .get()

    const revisionChanges = await db
      .select()
      .from(specChanges)
      .where(eq(specChanges.specRevisionId, revisionId))
      .orderBy(specChanges.changeNumber)

    return NextResponse.json({
      revision: { ...newRevision, changes: revisionChanges },
      notificationsCreated: linkedProjects.filter(
        (l) => l.currentAppliedRevision !== revisionNumber
      ).length,
      message: 'Revision published and notifications sent',
    })
  } catch (error) {
    console.error('Publish revision error:', error)
    return NextResponse.json({ error: 'Failed to publish revision' }, { status: 500 })
  }
}

// PATCH /api/specifications/[id] - Update specification
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

    const db = getDb()

    const access = await checkSpecAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 })
    }

    if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, discipline, status, ownerUserId } = body

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (discipline !== undefined) updates.discipline = discipline
    if (status !== undefined) updates.status = status
    if (ownerUserId !== undefined) updates.ownerUserId = ownerUserId

    await db.update(specifications).set(updates).where(eq(specifications.id, id))

    const updatedSpec = await db
      .select()
      .from(specifications)
      .where(eq(specifications.id, id))
      .get()

    return NextResponse.json({ specification: updatedSpec })
  } catch (error) {
    console.error('Update specification error:', error)
    return NextResponse.json({ error: 'Failed to update specification' }, { status: 500 })
  }
}

// POST /api/specifications/[id]/link - Link spec to projects
export async function PUT(
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

    const body = await req.json()
    const { projectIds, appliedRevision } = body

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ error: 'Project IDs are required' }, { status: 400 })
    }

    const db = getDb()

    const access = await checkSpecAccess(db, payload.userId, id)
    if (!access) {
      return NextResponse.json({ error: 'Specification not found' }, { status: 404 })
    }

    if (!['owner', 'admin', 'manager'].includes(access.membership.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const now = new Date()
    const revision = appliedRevision || access.spec.currentRevision
    let linked = 0

    for (const projectId of projectIds) {
      // Check project belongs to same org
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .get()

      if (!project || project.orgId !== access.spec.orgId) continue

      // Check if already linked
      const existingLink = await db
        .select()
        .from(projectSpecifications)
        .where(
          and(
            eq(projectSpecifications.projectId, projectId),
            eq(projectSpecifications.specId, id)
          )
        )
        .get()

      if (existingLink) continue

      await db.insert(projectSpecifications).values({
        id: generateId(),
        projectId,
        specId: id,
        currentAppliedRevision: revision,
        latestAvailableRevision: access.spec.currentRevision,
        updatedAt: now,
      })
      linked++
    }

    return NextResponse.json({
      message: `Linked ${linked} projects to specification`,
      linkedCount: linked,
    })
  } catch (error) {
    console.error('Link spec error:', error)
    return NextResponse.json({ error: 'Failed to link specification' }, { status: 500 })
  }
}
export const runtime = 'edge'
