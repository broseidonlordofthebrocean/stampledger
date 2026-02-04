'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  GitBranch,
  Plus,
  Search,
  FileText,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
  History,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Specification {
  id: string
  specNumber: string
  title: string
  description: string | null
  category: string | null
  issuingAuthority: string | null
  status: string
  currentRevision: string | null
  effectiveDate: string | null
  createdAt: string
  revisionCount?: number
  linkedProjectCount?: number
}

const CATEGORIES = [
  { value: 'structural', label: 'Structural' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'fire_protection', label: 'Fire Protection' },
  { value: 'civil', label: 'Civil' },
  { value: 'geotechnical', label: 'Geotechnical' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'general', label: 'General' },
]

export default function SpecificationsPage() {
  const { token, currentOrg } = useAuth()
  const [specifications, setSpecifications] = useState<Specification[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [createForm, setCreateForm] = useState({
    specNumber: '',
    title: '',
    description: '',
    category: 'general',
    issuingAuthority: '',
    effectiveDate: '',
    referenceUrl: '',
  })

  useEffect(() => {
    if (currentOrg) {
      fetchSpecifications()
    }
  }, [currentOrg])

  const fetchSpecifications = async () => {
    if (!token || !currentOrg) return
    setLoading(true)
    try {
      const res = await fetch(`/api/specifications?orgId=${currentOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSpecifications(data.specifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch specifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSpec = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !currentOrg) return
    setError('')

    try {
      const res = await fetch('/api/specifications', {
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
        throw new Error(data.error || 'Failed to create specification')
      }

      setShowCreateModal(false)
      setCreateForm({
        specNumber: '',
        title: '',
        description: '',
        category: 'general',
        issuingAuthority: '',
        effectiveDate: '',
        referenceUrl: '',
      })
      setSuccess('Specification created successfully')
      fetchSpecifications()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create specification')
    }
  }

  const filteredSpecs = specifications.filter((spec) => {
    const matchesSearch =
      spec.specNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.issuingAuthority?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || spec.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </span>
        )
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </span>
        )
      case 'superseded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Superseded
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Organization Selected</h2>
        <p className="text-gray-500">Please select or create an organization to view specifications.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Specifications</h1>
          <p className="text-gray-600 mt-1">
            Track industry specifications and standards for {currentOrg.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Specification
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <BookOpen className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Track Specification Changes</p>
            <p className="mt-1 text-blue-600">
              When you add a new revision to a specification, all linked projects will be notified
              of the change and marked for compliance review.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search specifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Specifications List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : filteredSpecs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Specifications Found</h2>
          <p className="text-gray-500 mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add specifications your organization uses'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Specification
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredSpecs.map((spec) => (
            <Link
              key={spec.id}
              href={`/specifications/${spec.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start min-w-0">
                <div className="bg-primary/10 p-2 rounded-lg mr-4 mt-0.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{spec.specNumber}</h3>
                    {getStatusBadge(spec.status)}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 truncate">{spec.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {spec.issuingAuthority && (
                      <span className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {spec.issuingAuthority}
                      </span>
                    )}
                    {spec.category && (
                      <span className="flex items-center capitalize">
                        {CATEGORIES.find((c) => c.value === spec.category)?.label || spec.category}
                      </span>
                    )}
                    {spec.currentRevision && (
                      <span className="flex items-center">
                        <History className="h-3 w-3 mr-1" />
                        Rev {spec.currentRevision}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 ml-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Linked Projects</p>
                  <p className="font-medium text-gray-700">{spec.linkedProjectCount || 0}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Spec Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Specification</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSpec} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spec Number *
                  </label>
                  <Input
                    value={createForm.specNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, specNumber: e.target.value })
                    }
                    placeholder="AISC 360-22"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Specification for Structural Steel Buildings"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Authority
                </label>
                <Input
                  value={createForm.issuingAuthority}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, issuingAuthority: e.target.value })
                  }
                  placeholder="American Institute of Steel Construction"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <Input
                  type="date"
                  value={createForm.effectiveDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, effectiveDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference URL
                </label>
                <Input
                  type="url"
                  value={createForm.referenceUrl}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, referenceUrl: e.target.value })
                  }
                  placeholder="https://www.aisc.org/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  placeholder="Brief description of the specification..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Specification</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
