'use client'

import { useState, useEffect, use } from 'react'
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
    createdAt: string
    revokedAt: string | null
    revokedReason: string | null
  }
  pe?: {
    name: string
    license: string | null
    state: string | null
  } | null
  blockchain?: {
    id: string
    verified: boolean
  }
  message: string
  error?: string
}

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyStamp()
  }, [id])

  const verifyStamp = async () => {
    try {
      const res = await fetch(`/api/verify/${id}`)
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({
        valid: false,
        message: 'Failed to verify stamp',
        error: 'Network error',
      })
    } finally {
      setLoading(false)
    }
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

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Result Card */}
        <div className="card">
          {/* Status Banner */}
          <div
            className={`-mx-6 -mt-6 px-6 py-8 rounded-t-xl text-center ${
              result?.valid
                ? 'bg-gradient-to-r from-accent to-accent-dark text-white'
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
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
          </div>

          {/* Stamp Details */}
          {result?.stamp && (
            <div className="mt-8 space-y-6">
              {/* Revocation Warning */}
              {result.stamp.status === 'revoked' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">
                        This stamp has been revoked
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        Revoked on:{' '}
                        {new Date(result.stamp.revokedAt!).toLocaleString()}
                      </p>
                      <p className="text-sm text-red-600">
                        Reason: {result.stamp.revokedReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PE Information */}
              {result.pe && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Professional Engineer
                  </h3>
                  <div className="bg-primary/5 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {result.pe.name}
                        </p>
                        {result.pe.license && (
                          <p className="text-sm text-gray-600">
                            License: {result.pe.license}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Project Details
                </h3>
                <dl className="space-y-3">
                  {result.stamp.projectName && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Project</dt>
                        <dd className="font-medium text-gray-900">
                          {result.stamp.projectName}
                        </dd>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500">Jurisdiction</dt>
                      <dd className="font-medium text-gray-900 capitalize">
                        {result.stamp.jurisdictionId.replace('-', ' ')}
                      </dd>
                    </div>
                  </div>
                  {result.stamp.permitNumber && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <dt className="text-xs text-gray-500">Permit Number</dt>
                        <dd className="font-medium text-gray-900">
                          {result.stamp.permitNumber}
                        </dd>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-xs text-gray-500">Stamped On</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(result.stamp.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              {/* Document Hash */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Document Fingerprint
                </h3>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-500">SHA-256 Hash</span>
                  </div>
                  <code className="text-xs font-mono text-gray-700 break-all">
                    {result.stamp.documentHash}
                  </code>
                </div>
              </div>

              {/* Blockchain Record */}
              {result.blockchain && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Blockchain Record
                  </h3>
                  <div className="bg-secondary/5 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.blockchain.verified ? (
                          <CheckCircle className="h-5 w-5 text-secondary" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {result.blockchain.verified
                            ? 'Verified on blockchain'
                            : 'Pending verification'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      ID: {result.blockchain.id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
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
