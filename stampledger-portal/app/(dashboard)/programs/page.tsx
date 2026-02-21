'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Layers,
  Plus,
  Search,
  FolderKanban,
  Calendar,
  X,
  Loader2,
  MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Program {
  id: string
  name: string
  description: string | null
  status: string
  createdAt: string
  projectCount?: number
}

export default function ProgramsPage() {
  const { token, currentOrg } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (currentOrg) {
      fetchPrograms()
    }
  }, [currentOrg])

  const fetchPrograms = async () => {
    if (!token || !currentOrg) return
    setLoading(true)
    try {
      const res = await fetch(`/api/programs?orgId=${currentOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPrograms(data.programs || [])
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !currentOrg) return
    setError('')

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          orgId: currentOrg.id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create program')
      }

      setShowCreateModal(false)
      setCreateForm({ name: '', description: '' })
      setSuccess('Program created successfully')
      fetchPrograms()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program')
    }
  }

  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold text-foreground mb-2">No Organization Selected</h2>
        <p className="text-muted-foreground">Please select or create an organization to view programs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programs</h1>
          <p className="text-muted-foreground mt-1">
            Organize related projects into programs for {currentOrg.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search programs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Programs List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No Programs Found</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Programs help you group related projects together'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {filteredPrograms.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center min-w-0">
                <div className="bg-primary/10 p-2 rounded-lg mr-4">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{program.name}</h3>
                  {program.description && (
                    <p className="text-sm text-muted-foreground truncate">{program.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <FolderKanban className="h-4 w-4 mr-1" />
                  {program.projectCount || 0} projects
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(program.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    program.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : program.status === 'archived'
                      ? 'bg-muted text-foreground'
                      : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {program.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Program</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Program Name *
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Highway Infrastructure 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Brief description of the program..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Program</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
