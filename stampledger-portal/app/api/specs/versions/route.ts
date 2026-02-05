import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { createDb, specVersions, specProjects } from '@/lib/db'
import { eq, desc, and } from 'drizzle-orm'

// POST /api/specs/versions - Create a new version
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
    const { projectId, version, specHash, changelog } = body

    if (!projectId || !version || !specHash) {
      return NextResponse.json(
        { error: 'Project ID, version, and spec hash are required' },
        { status: 400 }
      )
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Verify project exists and belongs to user
    const project = await db
      .select()
      .from(specProjects)
      .where(
        and(
          eq(specProjects.id, projectId),
          eq(specProjects.userId, payload.userId)
        )
      )
      .get()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get latest version to set as parent
    const latestVersion = await db
      .select()
      .from(specVersions)
      .where(eq(specVersions.projectId, projectId))
      .orderBy(desc(specVersions.createdAt))
      .get()

    const versionId = generateId()

    await db.insert(specVersions).values({
      id: versionId,
      projectId,
      version,
      specHash,
      changelog: changelog || null,
      parentVersionId: latestVersion?.id || null,
      createdAt: new Date(),
      userId: payload.userId,
    })

    const newVersion = await db
      .select()
      .from(specVersions)
      .where(eq(specVersions.id, versionId))
      .get()

    return NextResponse.json({ version: newVersion })
  } catch (error) {
    console.error('Create version error:', error)
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
  }
}
export const runtime = 'edge'
