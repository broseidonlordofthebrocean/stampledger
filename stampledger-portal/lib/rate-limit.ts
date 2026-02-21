import { getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'

// Simple rate limiter using D1 for Cloudflare Workers
// Uses a sliding window approach with a dedicated table

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Check and enforce rate limit.
 * @param key - Unique key (e.g., IP address, API key ID)
 * @param limit - Max requests allowed in the window
 * @param windowSeconds - Window duration in seconds (default 60)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const db = getDb()
  const now = Date.now()
  const windowStart = now - (windowSeconds * 1000)
  const resetAt = new Date(now + (windowSeconds * 1000))

  try {
    // Clean up old entries and count current window in one go
    // First, prune expired entries (older than 2x window to be safe)
    const pruneThreshold = now - (windowSeconds * 2000)
    await db.run(sql`
      DELETE FROM rate_limits
      WHERE created_at < ${pruneThreshold}
    `).catch(() => {}) // Table may not exist yet

    // Count requests in current window
    const countResult = await db.get<{ count: number }>(sql`
      SELECT COUNT(*) as count FROM rate_limits
      WHERE key = ${key} AND created_at >= ${windowStart}
    `).catch(() => null)

    const currentCount = countResult?.count || 0

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0, resetAt }
    }

    // Record this request
    await db.run(sql`
      INSERT INTO rate_limits (key, created_at) VALUES (${key}, ${now})
    `).catch(() => {}) // Non-critical

    return {
      allowed: true,
      remaining: Math.max(0, limit - currentCount - 1),
      resetAt,
    }
  } catch {
    // If rate limiting fails (e.g., table doesn't exist), allow the request
    return { allowed: true, remaining: limit, resetAt }
  }
}

/**
 * Extract a rate limit key from the request (IP-based)
 */
export function getRateLimitKey(req: Request, prefix: string = ''): string {
  const ip = req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
  return `${prefix}:${ip}`
}

/**
 * Add rate limit headers to a response
 */
export function withRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
  limit: number
): Response {
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt.getTime() / 1000)))
  return response
}
