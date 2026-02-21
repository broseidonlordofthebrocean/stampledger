'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminLicense {
  id: string
  userId: string
  licenseType: string
  licenseNumber: string
  issuingState: string
  issuingBody: string | null
  disciplines: string[]
  status: string
  verificationSource: string | null
  lastVerifiedAt: string | null
  issuedDate: string | null
  expirationDate: string | null
  createdAt: string
  userName: string
  userEmail: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending_verification', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'revoked', label: 'Revoked' },
]

export default function AdminLicensesPage() {
  const { isAdmin, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [licenses, setLicenses] = useState<AdminLicense[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, authLoading, router])

  // Check URL params for initial status filter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const status = params.get('status')
      if (status) setStatusFilter(status)
    }
  }, [])

  const fetchLicenses = useCallback(async (page = 1, status = '') => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status) params.set('status', status)

      const res = await fetch(`/api/admin/licenses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLicenses(data.licenses)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch licenses:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token && isAdmin) {
      fetchLicenses(1, statusFilter)
    }
  }, [token, isAdmin, statusFilter])

  const handleAction = async (licenseId: string, action: 'approve' | 'reject') => {
    if (!token) return
    setActionLoading(licenseId)
    try {
      const res = await fetch('/api/admin/licenses/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseId, action }),
      })
      if (res.ok) {
        fetchLicenses(pagination.page, statusFilter)
      }
    } catch (err) {
      console.error('Action failed:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3" /> Verified
          </span>
        )
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            <AlertTriangle className="h-3 w-3" /> Expired
          </span>
        )
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            <AlertTriangle className="h-3 w-3" /> Suspended
          </span>
        )
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            <XCircle className="h-3 w-3" /> Revoked
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        )
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Platform Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Award className="h-8 w-8" />
            License Review
          </h1>
          <p className="mt-2 text-white/70">
            {pagination.total} licenses {statusFilter ? `(${statusFilter.replace('_', ' ')})` : ''}
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-card rounded-lg border border-border p-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No licenses found {statusFilter ? `with status "${statusFilter.replace('_', ' ')}"` : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground pb-3 pl-1">License</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">User</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">State</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Source</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Submitted</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-accent">
                    <td className="py-3 pl-1">
                      <div>
                        <p className="font-medium text-foreground">
                          {license.licenseType} #{license.licenseNumber}
                        </p>
                        {license.issuingBody && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {license.issuingBody}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium text-foreground">{license.userName}</p>
                        <p className="text-xs text-muted-foreground">{license.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground font-medium">{license.issuingState}</td>
                    <td className="py-3">{statusBadge(license.status)}</td>
                    <td className="py-3 text-muted-foreground text-xs">
                      {license.verificationSource?.replace('_', ' ') || '-'}
                    </td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(license.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3">
                      {license.status === 'pending_verification' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(license.id, 'approve')}
                            disabled={actionLoading === license.id}
                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
                          >
                            {actionLoading === license.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" /> Approve
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(license.id, 'reject')}
                            disabled={actionLoading === license.id}
                            className="border-destructive/20 text-destructive hover:bg-destructive/10 h-7 px-3 text-xs"
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {license.status === 'active' && license.lastVerifiedAt && (
                        <span className="text-xs text-muted-foreground">
                          Verified {new Date(license.lastVerifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages} ({pagination.total} licenses)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchLicenses(pagination.page - 1, statusFilter)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchLicenses(pagination.page + 1, statusFilter)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
