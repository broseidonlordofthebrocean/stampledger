'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Stamp,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  X,
  Check,
  Coins,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: string
  name: string
  projectNumber: string
  status: string
}

interface SelectedProject {
  projectId: string
  project: Project
  documentHash?: string
  documentName?: string
}

type BatchStep = 'select-projects' | 'upload-documents' | 'review' | 'processing' | 'complete'

interface BatchResult {
  batchId: string
  stampsCreated: number
  tokensEarned: number
  totalTokens: number
  milestoneReached: string | null
  stamps: Array<{
    projectId: string
    stampId: string
    status: string
  }>
}

export default function BatchStampPage() {
  const { token, currentOrg, licenses, refreshUser } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<BatchStep>('select-projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<SelectedProject[]>([])
  const [selectedLicenseId, setSelectedLicenseId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BatchResult | null>(null)

  useEffect(() => {
    if (currentOrg) {
      fetchProjects()
    }
    if (licenses.length > 0 && !selectedLicenseId) {
      setSelectedLicenseId(licenses[0].id)
    }
  }, [currentOrg, licenses])

  const fetchProjects = async () => {
    if (!token || !currentOrg) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects?orgId=${currentOrg.id}&status=active`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleProjectSelection = (project: Project) => {
    const exists = selectedProjects.find((sp) => sp.projectId === project.id)
    if (exists) {
      setSelectedProjects(selectedProjects.filter((sp) => sp.projectId !== project.id))
    } else {
      setSelectedProjects([...selectedProjects, { projectId: project.id, project }])
    }
  }

  const handleFileUpload = async (projectId: string, file: File) => {
    // Calculate SHA-256 hash
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    setSelectedProjects(
      selectedProjects.map((sp) =>
        sp.projectId === projectId
          ? { ...sp, documentHash: hashHex, documentName: file.name }
          : sp
      )
    )
  }

  const handleBatchStamp = async () => {
    if (!token || !selectedLicenseId) return
    setProcessing(true)
    setError('')

    try {
      const stampRequests = selectedProjects.map((sp) => ({
        projectId: sp.projectId,
        documentHash: sp.documentHash,
        projectName: sp.project.name,
      }))

      const res = await fetch('/api/stamps/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseId: selectedLicenseId,
          stamps: stampRequests,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create batch stamps')
      }

      const data = await res.json()
      setResult(data)
      setStep('complete')
      await refreshUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch stamps')
    } finally {
      setProcessing(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'select-projects':
        return selectedProjects.length > 0
      case 'upload-documents':
        return selectedProjects.every((sp) => sp.documentHash)
      case 'review':
        return selectedLicenseId && selectedProjects.length > 0
      default:
        return false
    }
  }

  const nextStep = () => {
    switch (step) {
      case 'select-projects':
        setStep('upload-documents')
        break
      case 'upload-documents':
        setStep('review')
        break
      case 'review':
        setStep('processing')
        handleBatchStamp()
        break
    }
  }

  const prevStep = () => {
    switch (step) {
      case 'upload-documents':
        setStep('select-projects')
        break
      case 'review':
        setStep('upload-documents')
        break
    }
  }

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <Stamp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Organization Selected</h2>
        <p className="text-gray-500">Please select an organization to use batch stamping.</p>
      </div>
    )
  }

  if (licenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Professional License</h2>
        <p className="text-gray-500 mb-4">You need a professional license to stamp documents.</p>
        <Link href="/licenses">
          <Button>Add License</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/stamps"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Stamps
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Batch Stamping</h1>
          <p className="text-gray-600 mt-1">Stamp multiple projects at once</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {['select-projects', 'upload-documents', 'review', 'complete'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step === s || (step === 'processing' && s === 'review')
                    ? 'bg-primary text-white'
                    : step === 'complete' || idx < ['select-projects', 'upload-documents', 'review', 'complete'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {step === 'complete' || idx < ['select-projects', 'upload-documents', 'review', 'complete'].indexOf(step) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 3 && (
                <div
                  className={cn(
                    'w-16 md:w-24 h-1 mx-2',
                    idx < ['select-projects', 'upload-documents', 'review', 'complete'].indexOf(step)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Select Projects</span>
          <span>Upload Docs</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {step === 'select-projects' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Projects to Stamp</h2>
            <p className="text-gray-600 text-sm">
              Choose the projects you want to stamp. You can select multiple projects.
            </p>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No active projects found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {projects.map((project) => {
                  const isSelected = selectedProjects.some((sp) => sp.projectId === project.id)
                  return (
                    <button
                      key={project.id}
                      onClick={() => toggleProjectSelection(project)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors text-left',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center">
                        <div
                          className={cn(
                            'w-5 h-5 rounded border flex items-center justify-center mr-3',
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.projectNumber}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
        )}

        {step === 'upload-documents' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Upload Documents</h2>
            <p className="text-gray-600 text-sm">
              Upload the documents to be stamped for each project.
            </p>

            <div className="space-y-4">
              {selectedProjects.map((sp) => (
                <div
                  key={sp.projectId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{sp.project.name}</p>
                      <p className="text-sm text-gray-500">{sp.project.projectNumber}</p>
                    </div>
                    {sp.documentHash && (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Uploaded
                      </span>
                    )}
                  </div>

                  {sp.documentHash ? (
                    <div className="mt-3 flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-700">{sp.documentName}</span>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedProjects(
                            selectedProjects.map((p) =>
                              p.projectId === sp.projectId
                                ? { ...p, documentHash: undefined, documentName: undefined }
                                : p
                            )
                          )
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-3 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.dwg"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(sp.projectId, file)
                        }}
                      />
                      <Upload className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Upload document</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review & Confirm</h2>
            <p className="text-gray-600 text-sm">
              Review your batch stamp details before submitting.
            </p>

            {/* License Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stamp with License
              </label>
              <select
                value={selectedLicenseId}
                onChange={(e) => setSelectedLicenseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {licenses.map((license) => (
                  <option key={license.id} value={license.id}>
                    {license.licenseType} - {license.issuingState} #{license.licenseNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
              <div className="px-4 py-3 bg-gray-50">
                <p className="font-medium text-gray-900">Batch Summary</p>
              </div>
              {selectedProjects.map((sp) => (
                <div key={sp.projectId} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{sp.project.name}</p>
                    <p className="text-sm text-gray-500">{sp.documentName}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              ))}
            </div>

            {/* Token Preview */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Coins className="h-5 w-5 text-primary mr-2" />
                  <span className="text-sm text-gray-700">Estimated tokens earned</span>
                </div>
                <span className="font-semibold text-primary">
                  +{selectedProjects.length * 10} tokens
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Processing Batch Stamps</h2>
            <p className="text-gray-500 mt-2">
              Creating {selectedProjects.length} stamps on the blockchain...
            </p>
          </div>
        )}

        {step === 'complete' && result && (
          <div className="text-center py-8">
            <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Batch Complete!</h2>
            <p className="text-gray-500 mb-6">
              Successfully created {result.stampsCreated} stamps
            </p>

            {/* Results Summary */}
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch ID</span>
                  <span className="font-mono text-sm">{result.batchId.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stamps Created</span>
                  <span className="font-semibold">{result.stampsCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tokens Earned</span>
                  <span className="font-semibold text-primary">+{result.tokensEarned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tokens</span>
                  <span className="font-semibold">{result.totalTokens}</span>
                </div>
                {result.milestoneReached && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center text-yellow-600">
                      <Award className="h-5 w-5 mr-2" />
                      <span className="font-medium">Milestone: {result.milestoneReached}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link href="/stamps">
                <Button variant="outline">View All Stamps</Button>
              </Link>
              <Button onClick={() => {
                setStep('select-projects')
                setSelectedProjects([])
                setResult(null)
              }}>
                New Batch
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step !== 'processing' && step !== 'complete' && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 'select-projects'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
          >
            {step === 'review' ? 'Create Stamps' : 'Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
