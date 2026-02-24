'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Native select used until full page rewrite to shadcn Select
import {
  Upload,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  Hash,
} from 'lucide-react'
import { hashDocument } from '@/lib/crypto'
import { QRCodeImage } from '@/components/QRCode'

const JURISDICTIONS = [
  { id: 'wisconsin', name: 'Wisconsin' },
  { id: 'california', name: 'California' },
  { id: 'texas', name: 'Texas' },
  { id: 'new-york', name: 'New York' },
  { id: 'florida', name: 'Florida' },
]

type Step = 'upload' | 'details' | 'review' | 'success'

export default function CreateStampPage() {
  const router = useRouter()
  const { token, user } = useAuth()
  const [step, setStep] = useState<Step>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [file, setFile] = useState<File | null>(null)
  const [documentHash, setDocumentHash] = useState('')
  const [jurisdictionId, setJurisdictionId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [permitNumber, setPermitNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [scopeNotes, setScopeNotes] = useState('')

  // Result
  const [stamp, setStamp] = useState<any>(null)
  const [supersededCount, setSupersededCount] = useState(0)

  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
  const ALLOWED_EXTENSIONS = ['.pdf', '.dwg', '.dxf']

  const validateAndProcessFile = useCallback(async (selectedFile: File) => {
    setError('')
    setFile(null)
    setDocumentHash('')

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is 100 MB (got ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB)`)
      return
    }

    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File type not allowed. Accepted types: ${ALLOWED_EXTENSIONS.join(', ')}`)
      return
    }

    setFile(selectedFile)

    try {
      const hash = await hashDocument(selectedFile)
      setDocumentHash(hash)
    } catch (err) {
      setError('Failed to process file')
    }
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    await validateAndProcessFile(selectedFile)
  }, [validateAndProcessFile])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return
    await validateAndProcessFile(droppedFile)
  }, [validateAndProcessFile])

  const handleSubmit = async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/stamps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentHash,
          jurisdictionId,
          projectName: projectName || null,
          permitNumber: permitNumber || null,
          notes: notes || null,
          scopeNotes: scopeNotes || null,
          documentFilename: file?.name,
          documentSize: file?.size,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create stamp')
      }

      const data = await res.json()
      setStamp(data.stamp)
      setSupersededCount(data.supersededCount || 0)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create stamp')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToDetails = file && documentHash
  const canProceedToReview = jurisdictionId

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (step === 'upload') router.back()
            else if (step === 'details') setStep('upload')
            else if (step === 'review') setStep('details')
          }}
          className="p-2 hover:bg-accent rounded-lg"
          disabled={step === 'success'}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Create Stamp</h1>
          <p className="text-muted-foreground">
            {step === 'upload' && 'Step 1: Upload your document'}
            {step === 'details' && 'Step 2: Enter project details'}
            {step === 'review' && 'Step 3: Review and confirm'}
            {step === 'success' && 'Stamp created successfully'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['upload', 'details', 'review', 'success'].map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full ${
              ['upload', 'details', 'review', 'success'].indexOf(step) >= i
                ? 'bg-cta'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="bg-card rounded-lg border border-border p-6space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file ? 'border-accent bg-accent/5' : 'border-input hover:border-cta'
            }`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {documentHash && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">SHA-256 Hash</p>
                    <p className="text-xs font-mono text-foreground break-all">
                      {documentHash}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Drop your document here
                  </p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.dwg,.dxf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          <Button
            onClick={() => setStep('details')}
            disabled={!canProceedToDetails}
            className="w-full"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step: Details */}
      {step === 'details' && (
        <div className="bg-card rounded-lg border border-border p-6space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground">Jurisdiction *</label>
            <select
              value={jurisdictionId}
              onChange={(e) => setJurisdictionId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select jurisdiction</option>
              {JURISDICTIONS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Project Name</label>
            <Input
              placeholder="e.g., Smith Residence Addition"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Permit Number</label>
            <Input
              placeholder="e.g., E-2026-1234"
              value={permitNumber}
              onChange={(e) => setPermitNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              className="flex w-full rounded-lg border border-input bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              rows={3}
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Scope & Liability Notes</label>
            <textarea
              className="flex w-full rounded-lg border border-input bg-card px-4 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              rows={3}
              placeholder="Define scope of professional responsibility, limitations, or conditions..."
              value={scopeNotes}
              onChange={(e) => setScopeNotes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Visible on verification page and certificate. Use to limit liability scope.
            </p>
          </div>

          <Button
            onClick={() => setStep('review')}
            disabled={!canProceedToReview}
            className="w-full"
          >
            Review Stamp
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="bg-card rounded-lg border border-border p-6space-y-6">
          <div className="bg-primary/5 rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">Stamp Summary</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Document</dt>
                <dd className="font-medium text-foreground">{file?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Jurisdiction</dt>
                <dd className="font-medium text-foreground">
                  {JURISDICTIONS.find((j) => j.id === jurisdictionId)?.name}
                </dd>
              </div>
              {projectName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Project</dt>
                  <dd className="font-medium text-foreground">{projectName}</dd>
                </div>
              )}
              {permitNumber && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Permit #</dt>
                  <dd className="font-medium text-foreground">{permitNumber}</dd>
                </div>
              )}
              {scopeNotes && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Scope Notes</dt>
                  <dd className="font-medium text-foreground text-right max-w-[250px]">{scopeNotes}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">PE</dt>
                <dd className="font-medium text-foreground">
                  {user?.name}
                  {user?.peLicenseNumber && ` (${user.peState}-${user.peLicenseNumber})`}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Document Hash</span>
            </div>
            <p className="text-xs font-mono text-foreground break-all">
              {documentHash}
            </p>
          </div>

          <div className="bg-cta/5 border border-cta/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-cta mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  This stamp will be permanently recorded
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once created, this stamp cannot be deleted. You can revoke it
                  if needed, but the record will remain on the blockchain.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating stamp...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Create Stamp
              </>
            )}
          </Button>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && stamp && (
        <div className="bg-card rounded-lg border border-border p-6text-center space-y-6">
          <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">
              Stamp Created Successfully
            </h2>
            <p className="text-muted-foreground mt-2">
              Your document has been stamped and recorded.
            </p>
          </div>

          {supersededCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
              {supersededCount} previous version{supersededCount > 1 ? 's' : ''} for this project {supersededCount > 1 ? 'were' : 'was'} automatically superseded. Anyone verifying the old stamp{supersededCount > 1 ? 's' : ''} will see a link to this new version.
            </div>
          )}

          {stamp.verifyUrl && (
            <div className="bg-card border rounded-xl p-6 inline-block">
              <QRCodeImage
                value={stamp.verifyUrl}
                size={192}
                className="mx-auto"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Scan to verify this stamp
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => router.push('/stamps')}
            >
              View All Stamps
            </Button>
            <Button onClick={() => router.push(`/stamps/${stamp.id}`)}>
              View Stamp Details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
