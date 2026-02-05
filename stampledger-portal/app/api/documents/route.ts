import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { createDb, documents } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/documents - List user's documents
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

    // @ts-ignore
    const db = createDb(process.env.DB)

    const userDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, payload.userId))
      .orderBy(desc(documents.createdAt))

    return NextResponse.json({ documents: userDocs })
  } catch (error) {
    console.error('Get documents error:', error)
    return NextResponse.json({ error: 'Failed to get documents' }, { status: 500 })
  }
}
export const runtime = 'edge'
