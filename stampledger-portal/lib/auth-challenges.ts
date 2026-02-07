import { getDb, authChallenges } from '@/lib/db'
import { generateId } from '@/lib/auth'
import { eq, lt } from 'drizzle-orm'

const CHALLENGE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export async function createChallenge(params: {
  challengeType: 'oauth_state' | 'webauthn_register' | 'webauthn_authenticate'
  challengeData: Record<string, unknown>
  userId?: string
}): Promise<string> {
  const db = getDb()
  const id = generateId()
  const now = new Date()

  await db.insert(authChallenges).values({
    id,
    challengeType: params.challengeType,
    challengeData: JSON.stringify(params.challengeData),
    userId: params.userId || null,
    expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
    createdAt: now,
  })

  return id
}

export async function consumeChallenge(id: string): Promise<{
  challengeType: string
  challengeData: Record<string, unknown>
  userId: string | null
} | null> {
  const db = getDb()
  const challenge = await db.select().from(authChallenges).where(eq(authChallenges.id, id)).get()

  if (!challenge) return null
  if (challenge.expiresAt < new Date()) {
    await db.delete(authChallenges).where(eq(authChallenges.id, id))
    return null
  }

  // One-time use: delete after consuming
  await db.delete(authChallenges).where(eq(authChallenges.id, id))

  return {
    challengeType: challenge.challengeType,
    challengeData: JSON.parse(challenge.challengeData),
    userId: challenge.userId,
  }
}

export async function cleanupExpiredChallenges(): Promise<void> {
  const db = getDb()
  await db.delete(authChallenges).where(lt(authChallenges.expiresAt, new Date()))
}
