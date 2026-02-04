import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { createDb, specProjects, specVersions } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

// GET /api/specs/projects/[id] - Get project with versions
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

    const project = await db
      .select()
      .from(specProjects)
      .where(
        and(
          eq(specProjects.id, id),
          eq(specProjects.userId, payload.userId)
        )
      )
      .get()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const versions = await db
      .select()
      .from(specVersions)
      .where(eq(specVersions.projectId, id))
      .orderBy(desc(specVersions.createdAt))

    return NextResponse.json({ project, versions })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({ error: 'Failed to get project' }, { status: 500 })
  }
}
