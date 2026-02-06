import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, specProjects, specVersions } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/specs/projects - List user's spec projects
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

    const db = getDb()

    const projects = await db
      .select()
      .from(specProjects)
      .where(eq(specProjects.userId, payload.userId))
      .orderBy(desc(specProjects.createdAt))

    // Get version count for each project
    const projectsWithCount = await Promise.all(
      projects.map(async (project) => {
        const versions = await db
          .select()
          .from(specVersions)
          .where(eq(specVersions.projectId, project.id))
        return {
          ...project,
          versionCount: versions.length,
          latestVersion: versions[0]?.version || null,
        }
      })
    )

    return NextResponse.json({ projects: projectsWithCount })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({ error: 'Failed to get projects' }, { status: 500 })
  }
}

// POST /api/specs/projects - Create a new project
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const db = getDb()

    const projectId = generateId()

    await db.insert(specProjects).values({
      id: projectId,
      name,
      description: description || null,
      createdAt: new Date(),
      userId: payload.userId,
    })

    const newProject = await db
      .select()
      .from(specProjects)
      .where(eq(specProjects.id, projectId))
      .get()

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
export const runtime = 'edge'
