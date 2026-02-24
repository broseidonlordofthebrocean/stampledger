// Auto-supersession: when a new stamp is created for a project,
// all previous active stamps for that project by the same user
// are automatically superseded.

import { stamps, stampStakeholders } from '@/lib/db'
import { eq, and, ne } from 'drizzle-orm'
import { sendEmail, EMAIL_CONFIG } from '@/lib/email'
import { generateId } from '@/lib/auth'
import { getVerifyUrl } from '@/lib/qrcode'

type DrizzleDb = ReturnType<typeof import('@/lib/db').getDb>

interface SupersessionResult {
  supersededCount: number
  supersededIds: string[]
}

/**
 * Automatically supersede all previous active stamps for the same project.
 * Called after creating a new stamp.
 *
 * Matching logic:
 * - If projectId is provided → match on projectId + userId
 * - Else if projectName is provided → match on projectName + userId
 * - Else → skip (can't match without project context)
 *
 * For each superseded stamp:
 * - Sets status='superseded', links to new stamp via supersededBy
 * - Copies stakeholders to the new stamp (deduplicated)
 * - Sends notification emails to affected stakeholders
 */
export async function autoSupersedePreviousStamps(
  db: DrizzleDb,
  userId: string,
  newStampId: string,
  projectName?: string | null,
  projectId?: string | null,
): Promise<SupersessionResult> {
  // Need at least one identifier to match on
  if (!projectId && !projectName) {
    return { supersededCount: 0, supersededIds: [] }
  }

  const now = new Date()

  // Find all active stamps for this project by this user (excluding the new one)
  let previousStamps
  if (projectId) {
    previousStamps = await db
      .select()
      .from(stamps)
      .where(
        and(
          eq(stamps.projectId, projectId),
          eq(stamps.userId, userId),
          eq(stamps.status, 'active'),
          ne(stamps.id, newStampId),
        ),
      )
  } else {
    previousStamps = await db
      .select()
      .from(stamps)
      .where(
        and(
          eq(stamps.projectName, projectName!),
          eq(stamps.userId, userId),
          eq(stamps.status, 'active'),
          ne(stamps.id, newStampId),
        ),
      )
  }

  if (previousStamps.length === 0) {
    return { supersededCount: 0, supersededIds: [] }
  }

  const supersededIds: string[] = []
  const seenEmails = new Set<string>()
  const newVerifyUrl = getVerifyUrl(newStampId)

  for (const oldStamp of previousStamps) {
    // Mark as superseded
    await db
      .update(stamps)
      .set({
        status: 'superseded',
        supersededBy: newStampId,
        supersededAt: now,
        supersessionReason: 'Automatically superseded by newer revision',
      })
      .where(eq(stamps.id, oldStamp.id))

    supersededIds.push(oldStamp.id)

    // Copy stakeholders to new stamp and notify them
    const stakeholders = await db
      .select()
      .from(stampStakeholders)
      .where(eq(stampStakeholders.stampId, oldStamp.id))

    for (const s of stakeholders) {
      // Deduplicate — don't add the same email twice to the new stamp
      if (!seenEmails.has(s.email)) {
        seenEmails.add(s.email)
        await db.insert(stampStakeholders).values({
          id: generateId(),
          stampId: newStampId,
          email: s.email,
          name: s.name,
          role: s.role,
          createdAt: now,
        })
      }

      // Notify about supersession
      try {
        await sendEmail({
          to: s.email,
          subject: EMAIL_CONFIG.templates.stampSuperseded.subject(
            oldStamp.projectName || 'Unknown Project',
          ),
          body: EMAIL_CONFIG.templates.stampSuperseded.getBody(
            oldStamp.projectName || 'Unknown Project',
            'Automatically superseded by newer revision',
            oldStamp.id,
            newStampId,
            newVerifyUrl,
          ),
        })
      } catch (err) {
        console.warn(`Failed to send supersession email to ${s.email}:`, err)
      }
    }
  }

  return {
    supersededCount: supersededIds.length,
    supersededIds,
  }
}
