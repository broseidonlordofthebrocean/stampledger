'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  FolderKanban,
  GitBranch,
  RefreshCw,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  FileText,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComplianceItem {
  projectId: string
  projectName: string
  projectNumber: string
  specId: string
  specNumber: string
  specTitle: string
  status: 'compliant' | 'outdated' | 'pending_review' | 'not_applicable'
  currentRevision: string | null
  projectRevision: string | null
  lastReviewedAt: string | null
  dueDate: string | null
}

interface ComplianceSummary {
  total: number
  compliant: number
  outdated: number
  pendingReview: number
}

export default function CompliancePage() {
  const { token, currentOrg } = useAuth()
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([])
  const [summary, setSummary] = useState<ComplianceSummary>({
    total: 0,
    compliant: 0,
    outdated: 0,
    pendingReview: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'outdated' | 'pending_review'>('all')

  useEffect(() => {
    if (currentOrg) {
      fetchComplianceData()
    }
  }, [currentOrg])

  const fetchComplianceData = async () => {
    if (!token || !currentOrg) return
    setLoading(true)
    try {
      // Fetch project specifications with compliance status
      const res = await fetch(`/api/compliance?orgId=${currentOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setComplianceItems(data.items || [])
        setSummary(data.summary || { total: 0, compliant: 0, outdated: 0, pendingReview: 0 })
      }
    } catch (err) {
      console.error('Failed to fetch compliance data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = complianceItems.filter((item) => {
    if (filter === 'all') return true
    if (filter === 'outdated') return item.status === 'outdated'
    if (filter === 'pending_review') return item.status === 'pending_review'
    return true
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'outdated':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'pending_review':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'Compliant'
      case 'outdated':
        return 'Outdated'
      case 'pending_review':
        return 'Pending Review'
      case 'not_applicable':
        return 'N/A'
      default:
        return status
    }
  }

  const compliancePercentage = summary.total > 0
    ? Math.round((summary.compliant / summary.total) * 100)
    : 0

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No Organization Selected</h2>
        <p className="text-gray-500">Please select or create an organization to view compliance.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track specification compliance across projects for {currentOrg.name}
          </p>
        </div>
        <Button variant="outline" onClick={fetchComplianceData} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Compliance Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{compliancePercentage}%</p>
            </div>
            <div
              className={cn(
                "p-3 rounded-full",
                compliancePercentage >= 90
                  ? "bg-green-100"
                  : compliancePercentage >= 70
                  ? "bg-yellow-100"
                  : "bg-red-100"
              )}
            >
              <ClipboardCheck
                className={cn(
                  "h-6 w-6",
                  compliancePercentage >= 90
                    ? "text-green-600"
                    : compliancePercentage >= 70
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              />
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                compliancePercentage >= 90
                  ? "bg-green-500"
                  : compliancePercentage >= 70
                  ? "bg-yellow-500"
                  : "bg-red-500"
              )}
              style={{ width: `${compliancePercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tracked</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Project-specification links</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Compliant</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{summary.compliant}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">Up to date with latest revisions</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Needs Attention</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {summary.outdated + summary.pendingReview}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            {summary.outdated} outdated, {summary.pendingReview} pending
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === 'all'
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          All ({summary.total})
        </button>
        <button
          onClick={() => setFilter('outdated')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === 'outdated'
              ? "bg-red-600 text-white"
              : "bg-red-50 text-red-700 hover:bg-red-100"
          )}
        >
          Outdated ({summary.outdated})
        </button>
        <button
          onClick={() => setFilter('pending_review')}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            filter === 'pending_review'
              ? "bg-yellow-600 text-white"
              : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          )}
        >
          Pending Review ({summary.pendingReview})
        </button>
      </div>

      {/* Compliance Items List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No Compliance Data' : `No ${getStatusLabel(filter)} Items`}
          </h2>
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? 'Link specifications to your projects to start tracking compliance'
              : 'All items in this category have been addressed'}
          </p>
          {filter === 'all' && (
            <div className="flex justify-center gap-4">
              <Link href="/projects">
                <Button variant="outline">
                  <FolderKanban className="h-4 w-4 mr-2" />
                  View Projects
                </Button>
              </Link>
              <Link href="/specifications">
                <Button>
                  <GitBranch className="h-4 w-4 mr-2" />
                  View Specifications
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredItems.map((item, idx) => (
            <div
              key={`${item.projectId}-${item.specId}-${idx}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex items-center min-w-0">
                {getStatusIcon(item.status)}
                <div className="ml-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/projects/${item.projectId}`}
                      className="font-semibold text-gray-900 hover:text-primary"
                    >
                      {item.projectName}
                    </Link>
                    <span className="text-gray-400">→</span>
                    <Link
                      href={`/specifications/${item.specId}`}
                      className="text-gray-700 hover:text-primary"
                    >
                      {item.specNumber}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{item.specTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 ml-4">
                <div className="text-right text-sm">
                  <p className="text-gray-500">Project Rev</p>
                  <p className={cn(
                    "font-medium",
                    item.status === 'outdated' ? "text-red-600" : "text-gray-900"
                  )}>
                    {item.projectRevision || '-'}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500">Current Rev</p>
                  <p className="font-medium text-gray-900">{item.currentRevision || '-'}</p>
                </div>
                <span
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full",
                    item.status === 'compliant' && "bg-green-100 text-green-700",
                    item.status === 'outdated' && "bg-red-100 text-red-700",
                    item.status === 'pending_review' && "bg-yellow-100 text-yellow-700",
                    item.status === 'not_applicable' && "bg-gray-100 text-gray-700"
                  )}
                >
                  {getStatusLabel(item.status)}
                </span>
                <Link
                  href={`/projects/${item.projectId}`}
                  className="text-gray-400 hover:text-primary"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
