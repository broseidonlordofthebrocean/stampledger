import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import {
  createDb,
  projects,
  projectSpecifications,
  specifications,
  specRevisions,
  orgMemberships,
} from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'

// GET /api/compliance - Get compliance data for an organization
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Verify user has access to org
    const membership = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, payload.userId),
          eq(orgMemberships.orgId, orgId),
          eq(orgMemberships.status, 'active')
        )
      )
      .get()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all project-specification links with compliance status
    const projectSpecs = await db
      .select({
        projectSpec: projectSpecifications,
        project: projects,
        spec: specifications,
      })
      .from(projectSpecifications)
      .innerJoin(projects, eq(projectSpecifications.projectId, projects.id))
      .innerJoin(specifications, eq(projectSpecifications.specId, specifications.id))
      .where(eq(projects.orgId, orgId))

    // Build compliance items with revision comparison
    const items = projectSpecs.map((ps) => {
      const projectRevision = ps.projectSpec.currentAppliedRevision
      const currentRevision = ps.spec.currentRevision

      let status: 'compliant' | 'outdated' | 'pending_review' | 'not_applicable' = 'compliant'

      // Check if there's a latest available revision that's different from applied
      const hasUpdate = ps.projectSpec.latestAvailableRevision &&
        ps.projectSpec.latestAvailableRevision !== projectRevision

      if (!projectRevision) {
        status = 'pending_review'
      } else if (currentRevision && projectRevision !== currentRevision) {
        status = 'outdated'
      }

      return {
        projectId: ps.project.id,
        projectName: ps.project.name,
        projectNumber: ps.project.projectNumber,
        specId: ps.spec.id,
        specNumber: ps.spec.specNumber,
        specTitle: ps.spec.title,
        status,
        currentRevision,
        projectRevision,
        lastReviewedAt: ps.projectSpec.updatedAt?.toISOString() || null,
        dueDate: null,
      }
    })

    // Calculate summary
    const summary = {
      total: items.length,
      compliant: items.filter((i) => i.status === 'compliant').length,
      outdated: items.filter((i) => i.status === 'outdated').length,
      pendingReview: items.filter((i) => i.status === 'pending_review').length,
    }

    return NextResponse.json({ items, summary })
  } catch (error) {
    console.error('Get compliance error:', error)
    return NextResponse.json({ error: 'Failed to get compliance data' }, { status: 500 })
  }
}
export const runtime = 'edge'
