import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import {
  createDb,
  stamps,
  documents,
  projects,
  specifications,
  projectSpecifications,
  orgMemberships,
} from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'

// GET /api/dashboard/stats - Get dashboard statistics for an organization
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

    // Get counts
    const stampsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(stamps)
      .where(eq(stamps.orgId, orgId))
      .get()

    const documentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.orgId, orgId))
      .get()

    const projectsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.orgId, orgId), eq(projects.status, 'active')))
      .get()

    const specificationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(specifications)
      .where(eq(specifications.orgId, orgId))
      .get()

    // Get compliance stats
    const projectSpecs = await db
      .select({
        projectSpec: projectSpecifications,
        spec: specifications,
      })
      .from(projectSpecifications)
      .innerJoin(projects, eq(projectSpecifications.projectId, projects.id))
      .innerJoin(specifications, eq(projectSpecifications.specId, specifications.id))
      .where(eq(projects.orgId, orgId))

    let compliant = 0
    let total = projectSpecs.length

    for (const ps of projectSpecs) {
      const projectRev = ps.projectSpec.currentAppliedRevision
      const currentRev = ps.spec.currentRevision
      // Compliant if project is using the current spec revision
      if (projectRev && currentRev && projectRev === currentRev) {
        compliant++
      }
    }

    const compliancePercentage = total > 0 ? Math.round((compliant / total) * 100) : 100

    // Get recent activity
    const recentStamps = await db
      .select()
      .from(stamps)
      .where(eq(stamps.orgId, orgId))
      .orderBy(desc(stamps.createdAt))
      .limit(3)

    const recentProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.orgId, orgId))
      .orderBy(desc(projects.createdAt))
      .limit(3)

    const recentActivity = [
      ...recentStamps.map((s) => ({
        id: s.id,
        type: 'stamp' as const,
        title: `Stamp created for ${s.projectName || 'project'}`,
        timestamp: s.createdAt?.toISOString() || new Date().toISOString(),
      })),
      ...recentProjects.map((p) => ({
        id: p.id,
        type: 'project' as const,
        title: `Project "${p.name}" created`,
        timestamp: p.createdAt?.toISOString() || new Date().toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stamps: stampsCount?.count || 0,
      documents: documentsCount?.count || 0,
      projects: projectsCount?.count || 0,
      specifications: specificationsCount?.count || 0,
      compliance: {
        compliant,
        total,
        percentage: compliancePercentage,
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard stats' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'
