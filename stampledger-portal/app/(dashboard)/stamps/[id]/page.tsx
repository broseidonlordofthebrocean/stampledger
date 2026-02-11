'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Stamp,
  Copy,
  ExternalLink,
  AlertTriangle,
  Download,
  Eye,
  Link as LinkIcon,
} from 'lucide-react'
import { QRCodeImage, generateQRDataUrl } from '@/components/QRCode'

interface StampData {
  id: string
  blockchainId: string
  documentHash: string
  jurisdictionId: string
  projectName: string | null
  permitNumber: string | null
  notes: string | null
  status: string
  createdAt: string
  revokedAt: string | null
  revokedReason: string | null
  qrCodeDataUrl: string | null
  verifyUrl: string | null
  documentFilename: string | null
  documentSize: number | null
}

export default function StampDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { token } = useAuth()
  const [stamp, setStamp] = useState<StampData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [verifyCount, setVerifyCount] = useState<number | null>(null)

  useEffect(() => {
    fetchStamp()
  }, [id, token])

  const fetchStamp = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/stamps/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStamp(data.stamp)
      } else {
        router.push('/stamps')
      }
    } catch (error) {
      console.error('Failed to fetch stamp:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!token || !revokeReason) return
    setRevoking(true)

    try {
      const res = await fetch(`/api/stamps/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: revokeReason }),
      })

      if (res.ok) {
        const data = await res.json()
        setStamp(data.stamp)
        setShowRevokeModal(false)
      }
    } catch (error) {
      console.error('Failed to revoke stamp:', error)
    } finally {
      setRevoking(false)
    }
  }

  const copyHash = () => {
    if (stamp?.documentHash) {
      navigator.clipboard.writeText(stamp.documentHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const copyVerifyLink = () => {
    if (stamp?.verifyUrl) {
      navigator.clipboard.writeText(stamp.verifyUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const downloadQR = async () => {
    if (stamp?.verifyUrl) {
      const dataUrl = await generateQRDataUrl(stamp.verifyUrl)
      const link = document.createElement('a')
      link.download = `stamp-${stamp.id}-qr.png`
      link.href = dataUrl
      link.click()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!stamp) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">
            {stamp.projectName || 'Stamp Details'}
          </h1>
          <p className="text-gray-600">
            Created {new Date(stamp.createdAt).toLocaleString()}
          </p>
        </div>
        {stamp.status === 'active' ? (
          <span className="flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Active
          </span>
        ) : (
          <span className="flex items-center px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4 mr-1" />
            Revoked
          </span>
        )}
      </div>

      {/* Revoked Warning */}
      {stamp.status === 'revoked' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">This stamp has been revoked</p>
              <p className="text-sm text-red-600 mt-1">
                Reason: {stamp.revokedReason}
              </p>
              <p className="text-sm text-red-600">
                Revoked on: {new Date(stamp.revokedAt!).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Stamp Information</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-600">Jurisdiction</dt>
                <dd className="font-medium text-gray-900 capitalize">
                  {stamp.jurisdictionId.replace('-', ' ')}
                </dd>
              </div>
              {stamp.projectName && (
                <div>
                  <dt className="text-sm text-gray-600">Project Name</dt>
                  <dd className="font-medium text-gray-900">{stamp.projectName}</dd>
                </div>
              )}
              {stamp.permitNumber && (
                <div>
                  <dt className="text-sm text-gray-600">Permit Number</dt>
                  <dd className="font-medium text-gray-900">{stamp.permitNumber}</dd>
                </div>
              )}
              {stamp.documentFilename && (
                <div>
                  <dt className="text-sm text-gray-600">Document</dt>
                  <dd className="font-medium text-gray-900">
                    {stamp.documentFilename}
                    {stamp.documentSize && (
                      <span className="text-gray-500 ml-2">
                        ({(stamp.documentSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {stamp.notes && (
                <div>
                  <dt className="text-sm text-gray-600">Notes</dt>
                  <dd className="text-gray-900">{stamp.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Blockchain Record</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-600">Stamp ID</dt>
                <dd className="font-mono text-sm text-gray-900">{stamp.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Blockchain ID</dt>
                <dd className="font-mono text-sm text-gray-900">
                  {stamp.blockchainId}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 mb-1">Document Hash (SHA-256)</dt>
                <dd className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-gray-100 p-2 rounded break-all">
                    {stamp.documentHash}
                  </code>
                  <button
                    onClick={copyHash}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Copy hash"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          {stamp.status === 'active' && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <Button
                variant="danger"
                onClick={() => setShowRevokeModal(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Revoke Stamp
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Revoking a stamp marks it as invalid. This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* QR Code & Verification */}
        <div className="space-y-6">
          {stamp.verifyUrl && (
            <div className="card text-center">
              <h3 className="font-semibold text-gray-900 mb-4">Verification QR</h3>
              <QRCodeImage
                value={stamp.verifyUrl}
                size={200}
                className="w-full max-w-[200px] mx-auto rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-4">
                Scan to verify this stamp
              </p>
              <div className="mt-3 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={downloadQR}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </Button>
                {stamp.verifyUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={copyVerifyLink}
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-accent" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Copy Verify Link
                        </>
                      )}
                    </Button>
                    <a
                      href={stamp.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-cta hover:underline"
                    >
                      Open verification page
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Verification Certificate */}
          <div className="card text-center">
            <h3 className="font-semibold text-gray-900 mb-3">Certificate</h3>
            <a
              href={`/api/verify/${stamp.id}/certificate`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Certificate
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Revoke Stamp
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for revoking this stamp. This action cannot
              be undone.
            </p>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 mb-4"
              rows={3}
              placeholder="Reason for revocation..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRevokeModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleRevoke}
                disabled={!revokeReason || revoking}
              >
                {revoking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Revoke Stamp'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
