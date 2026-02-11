'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Award,
  Building2,
  Stamp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isLicensedProfessional: boolean
  createdAt: string
  orgCount: number
  licenseCount: number
  stampCount: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminUsersPage() {
  const { isAdmin, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, authLoading, router])

  const fetchUsers = useCallback(async (page = 1, searchQuery = '') => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token && isAdmin) {
      fetchUsers(1, search)
    }
  }, [token, isAdmin])

  const handleSearch = () => {
    fetchUsers(1, search)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
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
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="mt-2 text-white/70">
            {pagination.total} total users
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <Button onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {search ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-medium text-gray-500 pb-3 pl-1">User</th>
                  <th className="text-left font-medium text-gray-500 pb-3">Email</th>
                  <th className="text-center font-medium text-gray-500 pb-3" title="Organizations">
                    <Building2 className="h-4 w-4 inline" />
                  </th>
                  <th className="text-center font-medium text-gray-500 pb-3" title="Licenses">
                    <Award className="h-4 w-4 inline" />
                  </th>
                  <th className="text-center font-medium text-gray-500 pb-3" title="Stamps">
                    <Stamp className="h-4 w-4 inline" />
                  </th>
                  <th className="text-left font-medium text-gray-500 pb-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 pl-1">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          {user.isLicensedProfessional && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                              <Award className="h-3 w-3" /> Licensed
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{user.email}</td>
                    <td className="py-3 text-center text-gray-600">{user.orgCount}</td>
                    <td className="py-3 text-center text-gray-600">{user.licenseCount}</td>
                    <td className="py-3 text-center text-gray-600">{user.stampCount}</td>
                    <td className="py-3 text-gray-400 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
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
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} users)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1, search)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchUsers(pagination.page + 1, search)}
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
