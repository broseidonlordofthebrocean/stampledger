import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, documents } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { getRequestContext } from '@cloudflare/next-on-pages'

// POST /api/documents/upload - Upload a document
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const sha256Hash = formData.get('sha256Hash') as string
    const stampId = formData.get('stampId') as string | null
    const title = formData.get('title') as string | null
    const documentType = formData.get('documentType') as string | null
    const projectId = formData.get('projectId') as string | null
    const orgId = formData.get('orgId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // File size limit: 100 MB
    const MAX_FILE_SIZE = 100 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 100 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
        { status: 400 }
      )
    }

    // File type validation
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/acad', // .dwg
      'application/x-acad',
      'image/vnd.dwg',
      'application/dxf',
      'application/octet-stream', // fallback for .dwg files
    ]
    const ALLOWED_EXTENSIONS = ['.pdf', '.dwg', '.dxf']
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    if (!sha256Hash || !/^[a-f0-9]{64}$/i.test(sha256Hash)) {
      return NextResponse.json(
        { error: 'Invalid SHA-256 hash (must be 64 hex characters)' },
        { status: 400 }
      )
    }

    const { env } = getRequestContext()
    const r2Bucket = (env as any).R2_BUCKET

    // Generate unique key for R2
    const docId = generateId()
    const r2Key = `documents/${payload.userId}/${docId}/${file.name}`

    // Upload to R2
    if (r2Bucket) {
      const arrayBuffer = await file.arrayBuffer()
      await r2Bucket.put(r2Key, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          userId: payload.userId,
          sha256: sha256Hash,
        },
      })
    }

    const db = getDb()

    const now = new Date()

    // Store document metadata
    await db.insert(documents).values({
      id: docId,
      // New required fields
      title: title || file.name,
      documentType: documentType || 'other',
      updatedAt: now,
      // Optional org/project context
      orgId: orgId || null,
      projectId: projectId || null,
      // Legacy fields
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      r2Key,
      sha256Hash,
      stampId: stampId || null,
      createdAt: now,
      userId: payload.userId,
      createdBy: payload.userId,
    })

    // Fetch created document
    const newDoc = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId))
      .get()

    return NextResponse.json({
      document: newDoc,
      message: 'Document uploaded successfully',
    })
  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}
export const runtime = 'edge'
