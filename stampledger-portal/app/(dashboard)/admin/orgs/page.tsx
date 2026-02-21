'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Stamp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminOrg {
  id: string
  name: string
  slug: string
  type: string
  plan: string
  createdAt: string
  memberCount: number
  stampCount: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminOrgsPage() {
  const { isAdmin, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orgs, setOrgs] = useState<AdminOrg[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, authLoading, router])

  const fetchOrgs = useCallback(async (page = 1, searchQuery = '') => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/orgs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.organizations)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch orgs:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token && isAdmin) {
      fetchOrgs(1, search)
    }
  }, [token, isAdmin])

  const handleSearch = () => {
    fetchOrgs(1, search)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-muted text-muted-foreground',
      starter: 'bg-blue-100 text-blue-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700',
    }
    return colors[plan] || 'bg-muted text-muted-foreground'
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
            <Building2 className="h-8 w-8" />
            Organizations
          </h1>
          <p className="mt-2 text-white/70">
            {pagination.total} total organizations
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name or slug..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Button onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>
      </div>

      {/* Orgs Table */}
      <div className="bg-card rounded-lg border border-border p-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? 'No organizations match your search' : 'No organizations found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground pb-3 pl-1">Organization</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Type</th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Plan</th>
                  <th className="text-center font-medium text-muted-foreground pb-3" title="Members">
                    <Users className="h-4 w-4 inline" />
                  </th>
                  <th className="text-center font-medium text-muted-foreground pb-3" title="Stamps">
                    <Stamp className="h-4 w-4 inline" />
                  </th>
                  <th className="text-left font-medium text-muted-foreground pb-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-accent">
                    <td className="py-3 pl-1">
                      <div>
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-xs text-muted-foreground">{org.slug}</p>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground capitalize">{org.type}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${planBadge(org.plan)}`}>
                        {org.plan}
                      </span>
                    </td>
                    <td className="py-3 text-center text-muted-foreground">{org.memberCount}</td>
                    <td className="py-3 text-center text-muted-foreground">{org.stampCount}</td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(org.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
              Page {pagination.page} of {pagination.pages} ({pagination.total} organizations)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchOrgs(pagination.page - 1, search)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchOrgs(pagination.page + 1, search)}
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
