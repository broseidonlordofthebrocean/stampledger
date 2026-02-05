'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  GitBranch,
  GitCommit,
  Loader2,
  Hash,
  Calendar,
  X,
  Upload,
} from 'lucide-react'
import { hashDocument } from '@/lib/crypto'

interface ProjectData {
  id: string
  name: string
  description: string | null
  createdAt: string
}

interface VersionData {
  id: string
  version: string
  specHash: string
  changelog: string | null
  createdAt: string
  parentVersionId: string | null
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const router = useRouter()
  const { token } = useAuth()
  const [project, setProject] = useState<ProjectData | null>(null)
  const [versions, setVersions] = useState<VersionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)

  // New version form
  const [newVersion, setNewVersion] = useState('')
  const [newChangelog, setNewChangelog] = useState('')
  const [specFile, setSpecFile] = useState<File | null>(null)
  const [specHash, setSpecHash] = useState('')

  useEffect(() => {
    fetchProject()
  }, [projectId, token])

  const fetchProject = async () => {
    if (!token) return
    try {
      const res = await fetch(`/api/specs/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
        setVersions(data.versions)
      } else {
        router.push('/specs')
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSpecFile(file)
    try {
      const hash = await hashDocument(file)
      setSpecHash(hash)
    } catch (err) {
      console.error('Failed to hash file:', err)
    }
  }, [])

  const createVersion = async () => {
    if (!token || !newVersion || !specHash) return
    setCreating(true)

    try {
      const res = await fetch('/api/specs/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: projectId,
          version: newVersion,
          specHash,
          changelog: newChangelog || null,
        }),
      })

      if (res.ok) {
        await fetchProject()
        setShowCreateModal(false)
        setNewVersion('')
        setNewChangelog('')
        setSpecFile(null)
        setSpecHash('')
      }
    } catch (error) {
      console.error('Failed to create version:', error)
    } finally {
      setCreating(false)
    }
  }

  // Suggest next version
  const suggestNextVersion = () => {
    if (versions.length === 0) return '1.0.0'
    const latest = versions[0].version
    const parts = latest.split('.').map(Number)
    if (parts.length === 3) {
      parts[2]++
      return parts.join('.')
    }
    return `${latest}.1`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/specs')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600">{project.description}</p>
          )}
        </div>
        <Button onClick={() => { setNewVersion(suggestNextVersion()); setShowCreateModal(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Version
        </Button>
      </div>

      {/* Version Timeline */}
      {versions.length === 0 ? (
        <div className="card text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No versions yet</h3>
          <p className="text-gray-600 mt-1">
            Create the first version of this specification
          </p>
          <Button
            onClick={() => { setNewVersion('1.0.0'); setShowCreateModal(true) }}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Version 1.0.0
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Version History ({versions.length})
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Version entries */}
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                      index === 0
                        ? 'bg-accent text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <GitCommit className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 card">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-mono font-semibold ${
                            index === 0
                              ? 'bg-accent/10 text-accent'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          v{version.version}
                        </span>
                        {index === 0 && (
                          <span className="ml-2 text-xs text-accent font-medium">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {version.changelog && (
                      <p className="mt-3 text-gray-700">{version.changelog}</p>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Hash className="h-3 w-3" />
                      <code className="font-mono">
                        {version.specHash.slice(0, 32)}...
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Version
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Version Number *</label>
                <Input
                  placeholder="e.g., 1.0.0"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">Specification File *</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    specFile ? 'border-accent bg-accent/5' : 'border-gray-300'
                  }`}
                >
                  {specFile ? (
                    <div>
                      <p className="font-medium text-gray-900">{specFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {specHash.slice(0, 32)}...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Click to upload spec file
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ position: 'relative' }}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Changelog</label>
                <textarea
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
                  rows={3}
                  placeholder="What changed in this version..."
                  value={newChangelog}
                  onChange={(e) => setNewChangelog(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={createVersion}
                disabled={!newVersion || !specHash || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Version'
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
