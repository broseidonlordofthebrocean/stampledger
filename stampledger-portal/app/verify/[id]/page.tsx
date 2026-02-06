'use client'

import { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Hash,
  User,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Upload,
  Award,
  Link as LinkIcon,
  Download,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VerificationResult {
  valid: boolean
  stamp?: {
    id: string
    status: string
    documentHash: string
    jurisdictionId: string
    projectName: string | null
    permitNumber: string | null
    notes: string | null
    createdAt: string
    revokedAt: string | null
    revokedReason: string | null
    documentFilename: string | null
    documentSize: number | null
  }
  pe?: {
    name: string
    license: string | null
    state: string | null
    isLicensedProfessional: boolean
  } | null
  license?: {
    type: string
    number: string
    state: string
    issuingBody: string | null
    disciplines: string[]
    status: string
    expirationDate: string | null
  } | null
  document?: {
    id: string
    title: string
    documentType: string
    filename: string | null
    size: number | null
    discipline: string | null
  } | null
  blockchain?: {
    id: string
    txHash: string | null
    verified: boolean
  }
  verification?: {
    totalVerifications: number
    verifiedAt: string
    method: string
  }
  message: string
  error?: string
}

interface IntegrityResult {
  match: boolean
  documentHash: string
  stamps: Array<{
    id: string
    status: string
    projectName: string | null
    pe: { name: string; license: string | null } | null
  }>
  activeCount?: number
  message: string
}

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null)
  const [integrityLoading, setIntegrityLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    verifyStamp()
  }, [id])

  const verifyStamp = async () => {
    try {
      const res = await fetch(`/api/verify/${id}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({
        valid: false,
        message: 'Failed to verify stamp',
        error: 'Network error',
      })
    } finally {
      setLoading(false)
    }
  }

  const checkIntegrity = async (file: File) => {
    setIntegrityLoading(true)
    setIntegrityResult(null)
    try {
      // Hash client-side
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const sha256Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      const res = await fetch('/api/verify/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha256Hash }),
      })
      const data = await res.json()
      setIntegrityResult(data)
    } catch {
      setIntegrityResult({
        match: false,
        documentHash: '',
        stamps: [],
        message: 'Failed to check document integrity',
      })
    } finally {
      setIntegrityLoading(false)
    }
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) checkIntegrity(file)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) checkIntegrity(file)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Verifying stamp...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <span className="text-xl font-bold">StampLedger</span>
          </Link>
          <span className="text-sm text-white/70">Stamp Verification</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status Banner */}
        <div
          className={`rounded-xl p-8 text-center text-white ${
            result?.valid
              ? 'bg-gradient-to-r from-accent to-accent-dark'
              : result?.stamp?.status === 'revoked'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-gray-500 to-gray-600'
          }`}
        >
          {result?.valid ? (
            <>
              <CheckCircle className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Stamp Verified</h1>
              <p className="mt-2 text-white/90">{result.message}</p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold">
                {result?.error ? 'Verification Failed' : 'Stamp Invalid'}
              </h1>
              <p className="mt-2 text-white/90">{result?.message}</p>
            </>
          )}
          {result?.verification && (
            <p className="mt-3 text-xs text-white/60">
              Verified {result.verification.totalVerifications} time{result.verification.totalVerifications !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {result?.stamp && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Revocation Warning */}
            {result.stamp.status === 'revoked' && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">This stamp has been revoked</p>
                    <p className="text-sm text-red-600 mt-1">
                      Revoked on: {new Date(result.stamp.revokedAt!).toLocaleString()}
                    </p>
                    <p className="text-sm text-red-600">
                      Reason: {result.stamp.revokedReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PE Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Professional Engineer
              </h3>
              {result.pe ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{result.pe.name}</p>
                      {result.pe.license && (
                        <p className="text-sm text-gray-600">License: {result.pe.license}</p>
                      )}
                    </div>
                  </div>
                  {result.license && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-gray-900">
                          {result.license.type} #{result.license.number}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 ml-6">
                        {result.license.state}{result.license.issuingBody ? ` - ${result.license.issuingBody}` : ''}
                      </p>
                      {result.license.disciplines.length > 0 && (
                        <p className="text-xs text-gray-600 ml-6">
                          Disciplines: {result.license.disciplines.join(', ')}
                        </p>
                      )}
                      <p className="text-xs ml-6">
                        <span className={`font-medium ${result.license.status === 'active' ? 'text-accent' : 'text-red-500'}`}>
                          {result.license.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">PE information not available</p>
              )}
            </div>

            {/* Project Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Details
              </h3>
              <dl className="space-y-3">
                {result.stamp.projectName && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-gray-500">Project</dt>
                      <dd className="font-medium text-gray-900">{result.stamp.projectName}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-gray-500">Jurisdiction</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {result.stamp.jurisdictionId.replace(/-/g, ' ')}
                    </dd>
                  </div>
                </div>
                {result.stamp.permitNumber && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-gray-500">Permit Number</dt>
                      <dd className="font-medium text-gray-900">{result.stamp.permitNumber}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <dt className="text-xs text-gray-500">Stamped On</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(result.stamp.createdAt).toLocaleString()}
                    </dd>
                  </div>
                </div>
                {result.stamp.documentFilename && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <dt className="text-xs text-gray-500">Document</dt>
                      <dd className="font-medium text-gray-900">{result.stamp.documentFilename}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            {/* Document Hash */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Document Fingerprint
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">SHA-256 Hash</span>
                </div>
                <code className="text-xs font-mono text-gray-700 break-all block">
                  {result.stamp.documentHash}
                </code>
              </div>
              {result.document && (
                <div className="mt-3 text-sm text-gray-600">
                  <p>
                    Linked document: <span className="font-medium text-gray-900">{result.document.title}</span>
                  </p>
                  {result.document.discipline && (
                    <p className="capitalize">Discipline: {result.document.discipline}</p>
                  )}
                </div>
              )}
            </div>

            {/* Blockchain Record */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Blockchain Record
              </h3>
              {result.blockchain && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {result.blockchain.verified ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {result.blockchain.verified ? 'Recorded on blockchain' : 'Pending blockchain recording'}
                    </span>
                  </div>
                  {result.blockchain.id && (
                    <div>
                      <p className="text-xs text-gray-500">Blockchain ID</p>
                      <p className="text-xs font-mono text-gray-700 break-all">{result.blockchain.id}</p>
                    </div>
                  )}
                  {result.blockchain.txHash && (
                    <div>
                      <p className="text-xs text-gray-500">Transaction Hash</p>
                      <p className="text-xs font-mono text-gray-700 break-all">{result.blockchain.txHash}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document Integrity Check */}
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Document Integrity Check
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload the original document to verify it matches this stamp&apos;s recorded hash.
              </p>
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-cta bg-cta/5' : 'border-gray-300 hover:border-cta/50'
                }`}
              >
                {integrityLoading ? (
                  <div className="space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-cta mx-auto" />
                    <p className="text-sm text-gray-600">Hashing and verifying...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-700">Drop a file here or click to browse</p>
                    <p className="text-xs text-gray-500">The file will be hashed locally and compared</p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={integrityLoading}
                />
              </div>

              {integrityResult && (
                <div className={`mt-4 p-4 rounded-lg ${integrityResult.match ? 'bg-accent/10 border border-accent/20' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {integrityResult.match ? (
                      <CheckCircle className="h-5 w-5 text-accent" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`font-medium ${integrityResult.match ? 'text-accent-dark' : 'text-red-700'}`}>
                      {integrityResult.message}
                    </span>
                  </div>
                  {integrityResult.documentHash && (
                    <p className="text-xs font-mono text-gray-500 mt-1">
                      Hash: {integrityResult.documentHash}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex flex-wrap gap-3 justify-center">
              <a
                href={`/api/verify/${id}/certificate`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500">
            Verification powered by{' '}
            <Link href="/" className="text-cta hover:underline">
              StampLedger
            </Link>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Stamp ID: {id}
          </p>
        </div>
      </main>
    </div>
  )
}
export const runtime = 'edge'
