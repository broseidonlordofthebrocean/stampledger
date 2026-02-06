'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  Hash,
  Download,
  Calendar,
} from 'lucide-react'
import { hashDocument } from '@/lib/crypto'

interface DocumentData {
  id: string
  title: string
  documentType: string
  documentNumber: string | null
  discipline: string | null
  status: string
  filename: string | null
  mimeType: string | null
  size: number | null
  r2Key: string | null
  ipfsHash: string | null
  sha256Hash: string | null
  createdAt: string
}

export default function DocumentsPage() {
  const { token } = useAuth()
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [token])

  const fetchDocuments = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (file: File) => {
    if (!token) return
    setUploading(true)

    try {
      // Calculate hash
      const sha256Hash = await hashDocument(file)

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sha256Hash', sha256Hash)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (res.ok) {
        await fetchDocuments()
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [token])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-header mb-0">Documents</h1>
        <p className="text-gray-600">
          Store and manage your engineering documents securely
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? 'border-cta bg-cta/5'
            : 'border-gray-300 hover:border-cta/50'
        }`}
      >
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-cta mx-auto" />
            <p className="text-gray-600">Uploading and hashing document...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Drop your document here
              </p>
              <p className="text-sm text-gray-600">
                or click to browse (PDF, DWG, images)
              </p>
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.dwg,.png,.jpg,.jpeg"
            />
          </div>
        )}
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No documents yet</h3>
          <p className="text-gray-600 mt-1">
            Upload your first document to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Documents ({documents.length})
          </h2>
          <div className="grid gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="card-hover">
                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {doc.title || doc.filename || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      {doc.size != null && <span>{formatFileSize(doc.size)}</span>}
                      {doc.discipline && <span className="capitalize">{doc.discipline}</span>}
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {doc.sha256Hash && (
                      <div className="flex items-center gap-2 mt-2">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <code className="text-xs text-gray-500 font-mono truncate">
                          {doc.sha256Hash.slice(0, 32)}...
                        </code>
                      </div>
                    )}
                    {doc.ipfsHash && (
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-3 w-3 text-accent" />
                        <span className="text-xs text-accent">
                          Pinned to IPFS
                        </span>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
