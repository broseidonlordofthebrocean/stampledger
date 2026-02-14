'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  AlertTriangle,
  Download,
  Eye,
  Link as LinkIcon,
  ArrowRightLeft,
  BarChart3,
  Users,
  Plus,
  Trash2,
  Info,
  Upload,
} from 'lucide-react'
import { QRCodeImage, generateQRDataUrl } from '@/components/QRCode'
import { hashDocument } from '@/lib/crypto'

interface StampData {
  id: string
  blockchainId: string
  documentHash: string
  jurisdictionId: string
  projectName: string | null
  permitNumber: string | null
  notes: string | null
  scopeNotes: string | null
  status: string
  createdAt: string
  revokedAt: string | null
  revokedReason: string | null
  supersededBy: string | null
  supersededAt: string | null
  supersessionReason: string | null
  insuranceSnapshot: string | null
  qrCodeDataUrl: string | null
  verifyUrl: string | null
  documentFilename: string | null
  documentSize: number | null
}

interface Stakeholder {
  id: string
  stampId: string
  email: string
  name: string | null
  role: string | null
  notifiedAt: string | null
  createdAt: string
}

interface Analytics {
  total: number
  last7d: number
  last30d: number
  recentScans: { id: string; scannedAt: string; scanSource: string | null; referrer: string | null }[]
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

  // Supersede state
  const [showSupersedeModal, setShowSupersedeModal] = useState(false)
  const [superseding, setSuperseding] = useState(false)
  const [supersedeReason, setSupersedeReason] = useState('')
  const [supersedeFile, setSupersedeFile] = useState<File | null>(null)
  const [supersedeHash, setSupersedeHash] = useState('')

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  // Stakeholders state
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [showAddStakeholder, setShowAddStakeholder] = useState(false)
  const [newStakeholderEmail, setNewStakeholderEmail] = useState('')
  const [newStakeholderName, setNewStakeholderName] = useState('')
  const [newStakeholderRole, setNewStakeholderRole] = useState('')
  const [addingStakeholder, setAddingStakeholder] = useState(false)

  useEffect(() => {
    if (token) {
      fetchStamp()
      fetchAnalytics()
      fetchStakeholders()
    }
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

  const fetchAnalytics = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/stamps/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchStakeholders = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/stamps/${id}/stakeholders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStakeholders(data.stakeholders)
      }
    } catch (error) {
      console.error('Failed to fetch stakeholders:', error)
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

  const handleSupersedeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setSupersedeFile(selectedFile)
    try {
      const hash = await hashDocument(selectedFile)
      setSupersedeHash(hash)
    } catch {
      setSupersedeHash('')
    }
  }

  const handleSupersede = async () => {
    if (!token || !supersedeReason) return
    setSuperseding(true)

    try {
      const body: Record<string, unknown> = { reason: supersedeReason }
      if (supersedeFile && supersedeHash) {
        body.newDocumentHash = supersedeHash
        body.newDocumentFilename = supersedeFile.name
        body.newDocumentSize = supersedeFile.size
      }

      const res = await fetch(`/api/stamps/${id}/supersede`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        setStamp(data.oldStamp)
        setShowSupersedeModal(false)
        if (data.newStamp) {
          router.push(`/stamps/${data.newStamp.id}`)
        }
      }
    } catch (error) {
      console.error('Failed to supersede stamp:', error)
    } finally {
      setSuperseding(false)
    }
  }

  const handleAddStakeholder = async () => {
    if (!token || !newStakeholderEmail) return
    setAddingStakeholder(true)

    try {
      const res = await fetch(`/api/stamps/${id}/stakeholders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newStakeholderEmail,
          name: newStakeholderName || null,
          role: newStakeholderRole || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setStakeholders([...stakeholders, data.stakeholder])
        setNewStakeholderEmail('')
        setNewStakeholderName('')
        setNewStakeholderRole('')
        setShowAddStakeholder(false)
      }
    } catch (error) {
      console.error('Failed to add stakeholder:', error)
    } finally {
      setAddingStakeholder(false)
    }
  }

  const handleRemoveStakeholder = async (stakeholderId: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/stamps/${id}/stakeholders?stakeholderId=${stakeholderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setStakeholders(stakeholders.filter(s => s.id !== stakeholderId))
      }
    } catch (error) {
      console.error('Failed to remove stakeholder:', error)
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
        ) : stamp.status === 'superseded' ? (
          <span className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Superseded
          </span>
        ) : (
          <span className="flex items-center px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4 mr-1" />
            Revoked
          </span>
        )}
      </div>

      {/* Superseded Warning */}
      {stamp.status === 'superseded' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ArrowRightLeft className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">This stamp has been superseded</p>
              {stamp.supersessionReason && (
                <p className="text-sm text-yellow-700 mt-1">
                  Reason: {stamp.supersessionReason}
                </p>
              )}
              {stamp.supersededBy && (
                <button
                  onClick={() => router.push(`/stamps/${stamp.supersededBy}`)}
                  className="text-sm text-cta hover:underline mt-1 inline-flex items-center"
                >
                  View new version <ExternalLink className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

          {/* Scope Notes */}
          {stamp.scopeNotes && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-cta" />
                <h3 className="font-semibold text-gray-900">Scope & Liability Notes</h3>
              </div>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">
                {stamp.scopeNotes}
              </p>
            </div>
          )}

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

          {/* Verification Analytics */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-cta" />
              <h3 className="font-semibold text-gray-900">Verification Analytics</h3>
            </div>
            {analytics ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{analytics.total}</p>
                    <p className="text-xs text-gray-500">Total Scans</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{analytics.last7d}</p>
                    <p className="text-xs text-gray-500">Last 7 Days</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{analytics.last30d}</p>
                    <p className="text-xs text-gray-500">Last 30 Days</p>
                  </div>
                </div>
                {analytics.recentScans.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Recent Scans</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {analytics.recentScans.slice(0, 5).map((scan) => (
                        <div key={scan.id} className="flex justify-between text-xs bg-gray-50 px-3 py-2 rounded">
                          <span className="text-gray-600">
                            {new Date(scan.scannedAt).toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            {scan.scanSource || 'web'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Loading analytics...</p>
            )}
          </div>

          {/* Stakeholders */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cta" />
                <h3 className="font-semibold text-gray-900">Stakeholders</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddStakeholder(!showAddStakeholder)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {showAddStakeholder && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <Input
                  placeholder="Email *"
                  value={newStakeholderEmail}
                  onChange={(e) => setNewStakeholderEmail(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Name"
                    value={newStakeholderName}
                    onChange={(e) => setNewStakeholderName(e.target.value)}
                  />
                  <Input
                    placeholder="Role (e.g., contractor)"
                    value={newStakeholderRole}
                    onChange={(e) => setNewStakeholderRole(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleAddStakeholder}
                  disabled={!newStakeholderEmail || addingStakeholder}
                >
                  {addingStakeholder ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : null}
                  Add Stakeholder
                </Button>
              </div>
            )}

            {stakeholders.length > 0 ? (
              <div className="space-y-2">
                {stakeholders.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {s.name || s.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.email}{s.role ? ` - ${s.role}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStakeholder(s.id)}
                      className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No stakeholders added yet.</p>
            )}
          </div>

          {/* Actions */}
          {stamp.status === 'active' && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowSupersedeModal(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Supersede
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowRevokeModal(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Supersede replaces this stamp with a new version. Revoke marks it as invalid permanently.
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

      {/* Supersede Modal */}
      {showSupersedeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Supersede Stamp
            </h3>
            <p className="text-gray-600 mb-4">
              Upload a revised document to create a replacement stamp, or leave blank to just mark this stamp as superseded.
            </p>

            {/* New document upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revised Document (optional)
              </label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center ${supersedeFile ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}>
                {supersedeFile ? (
                  <div>
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-900">{supersedeFile.name}</p>
                    <p className="text-xs text-gray-500">{(supersedeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    {supersedeHash && (
                      <p className="text-xs font-mono text-gray-400 mt-1 break-all">{supersedeHash.slice(0, 16)}...</p>
                    )}
                    <button
                      onClick={() => { setSupersedeFile(null); setSupersedeHash('') }}
                      className="text-xs text-red-500 hover:underline mt-1"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Click to upload revised document</p>
                    <input
                      type="file"
                      accept=".pdf,.dwg"
                      onChange={handleSupersedeFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 mb-4"
              rows={3}
              placeholder="Reason for supersession (e.g., design revision, updated calculations)..."
              value={supersedeReason}
              onChange={(e) => setSupersedeReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSupersedeModal(false)
                  setSupersedeFile(null)
                  setSupersedeHash('')
                  setSupersedeReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSupersede}
                disabled={!supersedeReason || superseding}
              >
                {superseding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Superseding...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {supersedeFile ? 'Supersede & Create New' : 'Supersede'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
export const runtime = 'edge'
