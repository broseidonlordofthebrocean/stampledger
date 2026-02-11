import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, batchStamps, stamps, professionalLicenses, projects, projectSpecifications, changeNotifications, documentRevisions, orgMemberships, users } from '@/lib/db'
import { eq, and, inArray, sql } from 'drizzle-orm'
import { getVerifyUrl } from '@/lib/qrcode'

// Calculate milestone bonus tokens
function calculateMilestoneBonus(currentCount: number, stampsToAdd: number): number {
  let bonus = 0
  for (let i = currentCount + 1; i <= currentCount + stampsToAdd; i++) {
    if (i % 100 === 0) bonus += 25
    else if (i % 25 === 0) bonus += 10
    else if (i % 5 === 0) bonus += 5
  }
  return bonus
}

// POST /api/stamps/batch - Batch stamp multiple projects
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
    const { specChangeIds, projectIds, licenseId, reviewStatement } = body

    // Validation
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ error: 'Project IDs are required' }, { status: 400 })
    }
    if (!licenseId) {
      return NextResponse.json({ error: 'License ID is required' }, { status: 400 })
    }
    if (!reviewStatement) {
      return NextResponse.json({ error: 'Review statement is required' }, { status: 400 })
    }

    const db = getDb()

    // Verify the license exists and belongs to the user
    const license = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    if (!license || license.userId !== payload.userId) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    if (license.status !== 'active' && license.status !== 'pending_verification') {
      return NextResponse.json(
        { error: 'License is not active' },
        { status: 400 }
      )
    }

    // Check license expiration
    if (license.expirationDate && new Date(license.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: 'License has expired' },
        { status: 400 }
      )
    }

    // Get user info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .get()

    const now = new Date()
    const batchId = generateId()

    // Create batch record
    await db.insert(batchStamps).values({
      id: batchId,
      specChangeIds: JSON.stringify(specChangeIds || []),
      projectIds: JSON.stringify(projectIds),
      licenseId,
      reviewStatement,
      status: 'processing',
      createdBy: payload.userId,
      createdAt: now,
    })

    // Process each project
    const stampResults: string[] = []
    const failedProjects: string[] = []

    for (const projectId of projectIds) {
      try {
        // Get project
        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, projectId))
          .get()

        if (!project) {
          failedProjects.push(projectId)
          continue
        }

        // Check user has access to this project's org
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

        if (!membership || !['owner', 'admin', 'manager', 'member'].includes(membership.role)) {
          failedProjects.push(projectId)
          continue
        }

        // Create stamp
        const stampId = generateId()
        const verifyUrl = getVerifyUrl(stampId)

        // Create a document hash based on project and spec changes
        const hashInput = `${projectId}-${JSON.stringify(specChangeIds || [])}-${now.toISOString()}`
        const encoder = new TextEncoder()
        const data = encoder.encode(hashInput)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const documentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        await db.insert(stamps).values({
          id: stampId,
          blockchainId: `batch-${batchId}-${stampId}`,
          documentHash,
          jurisdictionId: license.issuingState,
          projectName: project.name,
          status: 'active',
          qrCodeDataUrl: null,
          verifyUrl,
          projectId: project.id,
          orgId: project.orgId,
          licenseId,
          batchId,
          specChangeIds: JSON.stringify(specChangeIds || []),
          reviewStatement,
          createdAt: now,
          userId: payload.userId,
        })

        stampResults.push(stampId)

        // Update any pending change notifications for this project as applied
        if (specChangeIds && specChangeIds.length > 0) {
          await db
            .update(changeNotifications)
            .set({
              status: 'applied',
              resolvedAt: now,
              resolutionNotes: `Applied via batch stamp ${batchId}`,
            })
            .where(
              and(
                eq(changeNotifications.projectId, projectId),
                eq(changeNotifications.status, 'pending')
              )
            )
        }
      } catch (err) {
        console.error(`Error stamping project ${projectId}:`, err)
        failedProjects.push(projectId)
      }
    }

    // Calculate tokens
    const stampsCreated = stampResults.length
    const bonus = calculateMilestoneBonus(license.stampTokenCount, stampsCreated)
    const totalTokens = stampsCreated + bonus

    // Update license token count
    await db
      .update(professionalLicenses)
      .set({
        stampTokenCount: sql`${professionalLicenses.stampTokenCount} + ${totalTokens}`,
        updatedAt: now,
      })
      .where(eq(professionalLicenses.id, licenseId))

    // Update batch record
    await db
      .update(batchStamps)
      .set({
        stampsCreated,
        tokensMinted: totalTokens,
        status: failedProjects.length === projectIds.length ? 'failed' : 'completed',
        failedProjectIds: failedProjects.length > 0 ? JSON.stringify(failedProjects) : null,
        completedAt: now,
      })
      .where(eq(batchStamps.id, batchId))

    // Get updated license
    const updatedLicense = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.id, licenseId))
      .get()

    return NextResponse.json({
      batchId,
      stampsCreated,
      tokensMinted: totalTokens,
      bonusTokens: bonus,
      stampIds: stampResults,
      failedProjects,
      peTokenCountNew: updatedLicense?.stampTokenCount || 0,
      message: `Successfully stamped ${stampsCreated} projects`,
    })
  } catch (error) {
    console.error('Batch stamp error:', error)
    return NextResponse.json({ error: 'Failed to process batch stamp' }, { status: 500 })
  }
}

// GET /api/stamps/batch - Get batch stamp history
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

    const batches = await db
      .select()
      .from(batchStamps)
      .where(eq(batchStamps.createdBy, payload.userId))
      .orderBy(sql`${batchStamps.createdAt} DESC`)

    const result = batches.map((b) => ({
      ...b,
      specChangeIds: JSON.parse(b.specChangeIds || '[]'),
      projectIds: JSON.parse(b.projectIds || '[]'),
      failedProjectIds: b.failedProjectIds ? JSON.parse(b.failedProjectIds) : [],
    }))

    return NextResponse.json({ batches: result })
  } catch (error) {
    console.error('Get batches error:', error)
    return NextResponse.json({ error: 'Failed to get batch history' }, { status: 500 })
  }
}
export const runtime = 'edge'
