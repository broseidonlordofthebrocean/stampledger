import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signToken, generateId } from '@/lib/auth'
import {
  getDb,
  users,
  professionalLicenses,
  organizations,
  orgMemberships,
  projects,
  programs,
  specifications,
  specRevisions,
  projectSpecifications,
  stamps,
  documents,
} from '@/lib/db'
import { eq } from 'drizzle-orm'

const DEMO_EMAIL = 'demo@stampledger.com'

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const now = new Date()

    // Check if demo user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .get()

    if (existingUser) {
      // Just log them in
      const token = await signToken(existingUser.id)
      return NextResponse.json({
        user: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          name: `${existingUser.firstName} ${existingUser.lastName}`.trim(),
          isLicensedProfessional: existingUser.isLicensedProfessional,
          peLicenseNumber: existingUser.peLicenseNumber,
          peState: existingUser.peState,
        },
        token,
      })
    }

    // Create demo user
    const userId = generateId()
    const passwordHash = await hashPassword('demo-password-2026')

    await db.insert(users).values({
      id: userId,
      email: DEMO_EMAIL,
      passwordHash,
      firstName: 'Alex',
      lastName: 'Thompson',
      phone: '(555) 867-5309',
      accountType: 'individual',
      isLicensedProfessional: true,
      peLicenseNumber: '98452',
      peState: 'TX',
      createdAt: now,
      updatedAt: now,
    })

    // Create PE license
    const licenseId = generateId()
    await db.insert(professionalLicenses).values({
      id: licenseId,
      userId,
      licenseType: 'PE',
      licenseNumber: '98452',
      issuingState: 'TX',
      issuingBody: 'Texas Board of Professional Engineers',
      disciplines: JSON.stringify(['civil', 'environmental']),
      status: 'active',
      stampTokenCount: 47,
      createdAt: now,
      updatedAt: now,
    })

    // Create organization
    const orgId = generateId()
    await db.insert(organizations).values({
      id: orgId,
      name: 'Acme Engineering Group',
      slug: 'acme-engineering',
      orgType: 'engineering_firm',
      addressLine1: '1200 Main St, Suite 400',
      city: 'Houston',
      state: 'TX',
      zip: '77002',
      phone: '(713) 555-0100',
      website: 'https://acme-eng.example.com',
      plan: 'professional',
      createdAt: now,
      updatedAt: now,
    })

    // Add user as org owner
    await db.insert(orgMemberships).values({
      id: generateId(),
      orgId,
      userId,
      role: 'owner',
      status: 'active',
      createdAt: now,
    })

    // Create a program
    const programId = generateId()
    await db.insert(programs).values({
      id: programId,
      orgId,
      name: 'City of Houston Pump Station Upgrades',
      description: 'Rehabilitation of 120 pump stations across the greater Houston area',
      projectCount: 3,
      status: 'active',
      createdAt: now,
    })

    // Create projects
    const projectData = [
      { name: 'PS-047 Westheimer Pump Station', number: 'PS-047', status: 'active', address: '4200 Westheimer Rd, Houston, TX' },
      { name: 'PS-103 Heights Lift Station', number: 'PS-103', status: 'construction', address: '1800 Heights Blvd, Houston, TX' },
      { name: 'PS-089 Bellaire Pump Station', number: 'PS-089', status: 'planning', address: '5100 Bellaire Blvd, Houston, TX' },
    ]

    const projectIds: string[] = []
    for (const p of projectData) {
      const pid = generateId()
      projectIds.push(pid)
      await db.insert(projects).values({
        id: pid,
        orgId,
        name: p.name,
        projectNumber: p.number,
        description: `Pump station rehabilitation - ${p.status}`,
        locationAddress: p.address,
        status: p.status,
        programId,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Create specifications
    const specData = [
      { title: 'Electrical Systems Specification', number: 'SP-E-001', discipline: 'electrical', rev: 'C' },
      { title: 'Structural Concrete Specification', number: 'SP-S-001', discipline: 'structural', rev: 'B' },
      { title: 'Mechanical Piping Specification', number: 'SP-M-001', discipline: 'mechanical', rev: 'A' },
    ]

    const specIds: string[] = []
    for (const s of specData) {
      const sid = generateId()
      specIds.push(sid)
      await db.insert(specifications).values({
        id: sid,
        orgId,
        title: s.title,
        specNumber: s.number,
        discipline: s.discipline,
        currentRevision: s.rev,
        status: 'active',
        ownerUserId: userId,
        createdAt: now,
        updatedAt: now,
      })

      // Create a revision for each spec
      await db.insert(specRevisions).values({
        id: generateId(),
        specId: sid,
        revisionNumber: s.rev,
        revisionLabel: `Rev ${s.rev} - Latest updates`,
        status: 'published',
        publishedAt: now,
        publishedBy: userId,
        createdAt: now,
      })
    }

    // Link specs to projects (some behind to show compliance gaps)
    await db.insert(projectSpecifications).values({
      id: generateId(),
      projectId: projectIds[0],
      specId: specIds[0],
      currentAppliedRevision: 'C',
      latestAvailableRevision: 'C',
      updatedAt: now,
    })
    await db.insert(projectSpecifications).values({
      id: generateId(),
      projectId: projectIds[0],
      specId: specIds[1],
      currentAppliedRevision: 'A',
      latestAvailableRevision: 'B',
      updatedAt: now,
    })
    await db.insert(projectSpecifications).values({
      id: generateId(),
      projectId: projectIds[1],
      specId: specIds[0],
      currentAppliedRevision: 'B',
      latestAvailableRevision: 'C',
      updatedAt: now,
    })
    await db.insert(projectSpecifications).values({
      id: generateId(),
      projectId: projectIds[1],
      specId: specIds[2],
      currentAppliedRevision: 'A',
      latestAvailableRevision: 'A',
      updatedAt: now,
    })

    // Create some stamps
    const stampData = [
      { project: 'PS-047 Westheimer', doc: 'Electrical Plans Rev C' },
      { project: 'PS-047 Westheimer', doc: 'Structural Details Rev B' },
      { project: 'PS-103 Heights', doc: 'Site Grading Plan Rev A' },
    ]

    for (const s of stampData) {
      await db.insert(stamps).values({
        id: generateId(),
        documentHash: crypto.randomUUID().replace(/-/g, ''),
        jurisdictionId: 'TX',
        projectName: s.project,
        notes: `Stamped ${s.doc}`,
        status: 'active',
        documentFilename: `${s.doc.replace(/\s/g, '_')}.pdf`,
        orgId,
        licenseId,
        createdAt: now,
        userId,
      })
    }

    // Create some documents
    const docData = [
      { title: 'Electrical Plans - PS-047', type: 'drawing', number: 'DWG-E-100', discipline: 'electrical' },
      { title: 'Structural Calculations - PS-047', type: 'calculation', number: 'CALC-S-047', discipline: 'structural' },
      { title: 'Site Survey Report', type: 'report', number: 'RPT-SURV-047', discipline: 'civil' },
    ]

    for (const d of docData) {
      await db.insert(documents).values({
        id: generateId(),
        orgId,
        projectId: projectIds[0],
        title: d.title,
        documentType: d.type,
        documentNumber: d.number,
        discipline: d.discipline,
        status: 'stamped',
        createdBy: userId,
        userId,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Generate JWT
    const token = await signToken(userId)

    return NextResponse.json({
      user: {
        id: userId,
        email: DEMO_EMAIL,
        firstName: 'Alex',
        lastName: 'Thompson',
        name: 'Alex Thompson',
        isLicensedProfessional: true,
        peLicenseNumber: '98452',
        peState: 'TX',
      },
      token,
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json(
      { error: 'Failed to create demo session' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
