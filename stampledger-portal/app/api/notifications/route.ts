import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { createDb, changeNotifications, specifications, specRevisions, specChanges, projects, projectSpecifications, orgMemberships } from '@/lib/db'
import { eq, and, desc, inArray } from 'drizzle-orm'

// GET /api/notifications - Get change notifications (for user or project)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

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

    if (projectId) {
      // Get notifications for a specific project
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .get()

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Check access
      const membership = await db
        .select()
        .from(orgMemberships)
        .where(
          and(
            eq(orgMemberships.orgId, project.orgId),
            eq(orgMemberships.userId, payload.userId),
            eq(orgMemberships.status, 'active')
          )
        )
        .get()

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      let query = db
        .select({
          notification: changeNotifications,
          spec: specifications,
          revision: specRevisions,
        })
        .from(changeNotifications)
        .innerJoin(specifications, eq(changeNotifications.specId, specifications.id))
        .innerJoin(specRevisions, eq(changeNotifications.specRevisionId, specRevisions.id))
        .where(eq(changeNotifications.projectId, projectId))

      const notifications = await query.orderBy(desc(changeNotifications.createdAt))

      // Get changes for each notification
      const result = await Promise.all(
        notifications.map(async (n) => {
          const changes = await db
            .select()
            .from(specChanges)
            .where(eq(specChanges.specRevisionId, n.revision.id))
            .orderBy(specChanges.changeNumber)

          return {
            id: n.notification.id,
            projectId: n.notification.projectId,
            specId: n.spec.id,
            specNumber: n.spec.specNumber,
            specTitle: n.spec.title,
            fromRevision: n.notification.fromRevision,
            toRevision: n.notification.toRevision,
            status: n.notification.status,
            assignedTo: n.notification.assignedTo,
            resolutionNotes: n.notification.resolutionNotes,
            createdAt: n.notification.createdAt,
            changes,
          }
        })
      )

      return NextResponse.json({ notifications: result })
    } else {
      // Get all notifications assigned to the user
      const notifications = await db
        .select({
          notification: changeNotifications,
          spec: specifications,
          project: projects,
        })
        .from(changeNotifications)
        .innerJoin(specifications, eq(changeNotifications.specId, specifications.id))
        .innerJoin(projects, eq(changeNotifications.projectId, projects.id))
        .where(eq(changeNotifications.assignedTo, payload.userId))
        .orderBy(desc(changeNotifications.createdAt))

      const result = notifications.map((n) => ({
        id: n.notification.id,
        projectId: n.project.id,
        projectName: n.project.name,
        projectNumber: n.project.projectNumber,
        specId: n.spec.id,
        specNumber: n.spec.specNumber,
        specTitle: n.spec.title,
        fromRevision: n.notification.fromRevision,
        toRevision: n.notification.toRevision,
        status: n.notification.status,
        createdAt: n.notification.createdAt,
      }))

      return NextResponse.json({ notifications: result })
    }
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 })
  }
}

// PATCH /api/notifications - Update notification status
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
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

    const body = await req.json()
    const { status, assignedTo, resolutionNotes } = body

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Get notification and check access
    const notification = await db
      .select()
      .from(changeNotifications)
      .where(eq(changeNotifications.id, notificationId))
      .get()

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, notification.projectId))
      .get()

    const membership = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.orgId, project!.orgId),
          eq(orgMemberships.userId, payload.userId),
          eq(orgMemberships.status, 'active')
        )
      )
      .get()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const now = new Date()
    const updates: Record<string, any> = {}

    if (status) {
      updates.status = status
      if (status === 'acknowledged') {
        updates.acknowledgedAt = now
      } else if (['applied', 'not_applicable', 'deferred'].includes(status)) {
        updates.resolvedAt = now
      }
    }
    if (assignedTo !== undefined) updates.assignedTo = assignedTo
    if (resolutionNotes !== undefined) updates.resolutionNotes = resolutionNotes

    await db
      .update(changeNotifications)
      .set(updates)
      .where(eq(changeNotifications.id, notificationId))

    // If marked as applied, update the project-spec link
    if (status === 'applied' && notification.toRevision) {
      await db
        .update(projectSpecifications)
        .set({
          currentAppliedRevision: notification.toRevision,
          updatedAt: now,
        })
        .where(
          and(
            eq(projectSpecifications.projectId, notification.projectId),
            eq(projectSpecifications.specId, notification.specId)
          )
        )
    }

    const updatedNotification = await db
      .select()
      .from(changeNotifications)
      .where(eq(changeNotifications.id, notificationId))
      .get()

    return NextResponse.json({ notification: updatedNotification })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
export const runtime = 'edge'
