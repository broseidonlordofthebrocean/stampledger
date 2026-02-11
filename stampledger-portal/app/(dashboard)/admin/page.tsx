'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert,
  Users,
  Building2,
  Stamp,
  Award,
  Search,
  TrendingUp,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface AdminStats {
  users: { total: number }
  organizations: { total: number }
  stamps: { total: number; active: number; revoked: number }
  licenses: { total: number; pending: number; active: number; expired: number }
  verifications: { total: number }
  recentSignups: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    createdAt: string
  }>
}

export default function AdminPage() {
  const { isAdmin, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, authLoading, router])

  useEffect(() => {
    if (token && isAdmin) {
      fetchStats()
    }
  }, [token, isAdmin])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.users.total || 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-500',
      href: '/admin/users',
    },
    {
      label: 'Organizations',
      value: stats?.organizations.total || 0,
      icon: Building2,
      color: 'bg-teal-50 text-teal-500',
      href: '/admin/orgs',
    },
    {
      label: 'Total Stamps',
      value: stats?.stamps.total || 0,
      icon: Stamp,
      color: 'bg-orange-50 text-orange-500',
      href: null,
    },
    {
      label: 'Licenses',
      value: stats?.licenses.total || 0,
      icon: Award,
      color: 'bg-purple-50 text-purple-500',
      href: '/admin/licenses',
    },
    {
      label: 'Verifications',
      value: stats?.verifications.total || 0,
      icon: Search,
      color: 'bg-green-50 text-green-500',
      href: null,
    },
    {
      label: 'Pending Licenses',
      value: stats?.licenses.pending || 0,
      icon: Clock,
      color: stats?.licenses.pending ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400',
      href: '/admin/licenses?status=pending_verification',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Platform Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-white/70">
            System overview and management tools
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => {
            const content = (
              <div className="card hover:shadow-md hover:border-gray-200 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
                {card.href && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500 group-hover:text-primary transition-colors flex items-center gap-1">
                      View details
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                )}
              </div>
            )

            return card.href ? (
              <Link key={card.label} href={card.href}>{content}</Link>
            ) : (
              <div key={card.label}>{content}</div>
            )
          })}
        </div>
      )}

      {/* Stamp Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Stamp className="h-5 w-5 text-orange-500" />
              Stamp Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-semibold text-green-600">{stats.stamps.active}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: stats.stamps.total ? `${(stats.stamps.active / stats.stamps.total) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revoked</span>
                <span className="text-sm font-semibold text-red-600">{stats.stamps.revoked}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: stats.stamps.total ? `${(stats.stamps.revoked / stats.stamps.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              License Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Active', count: stats.licenses.active, color: 'bg-green-500' },
                { label: 'Pending', count: stats.licenses.pending, color: 'bg-amber-500' },
                { label: 'Expired', count: stats.licenses.expired, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: stats.licenses.total ? `${(item.count / stats.licenses.total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Signups */}
      {stats?.recentSignups && stats.recentSignups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Recent Signups
            </h2>
            <Link
              href="/admin/users"
              className="text-sm text-primary hover:text-primary-light transition-colors flex items-center gap-1"
            >
              View all users
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left font-medium text-gray-500 pb-3">Name</th>
                    <th className="text-left font-medium text-gray-500 pb-3">Email</th>
                    <th className="text-left font-medium text-gray-500 pb-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentSignups.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-3 text-gray-600">{user.email}</td>
                      <td className="py-3 text-gray-400">
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
          </div>
        </div>
      )}
    </div>
  )
}
