'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Stamp,
  FileText,
  GitBranch,
  Plus,
  ArrowRight,
  Shield,
  CheckCircle,
  FolderKanban,
  AlertCircle,
  Coins,
  ClipboardCheck,
  Award,
  Building2,
  TrendingUp,
  Layers,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStats {
  stamps: number
  documents: number
  projects: number
  specifications: number
  compliance: {
    compliant: number
    total: number
    percentage: number
  }
  recentActivity: Array<{
    id: string
    type: 'stamp' | 'document' | 'spec_change' | 'project'
    title: string
    timestamp: string
  }>
}

export default function DashboardPage() {
  const { user, currentOrg, totalTokens, licenses, token } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrg && token) {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [currentOrg, token])

  const fetchStats = async () => {
    if (!token || !currentOrg) return
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/stats?orgId=${currentOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Create Stamp',
      description: 'Stamp a document with your PE seal',
      href: '/stamps/create',
      icon: Stamp,
      color: 'bg-cta',
    },
    {
      title: 'Batch Stamp',
      description: 'Stamp multiple projects at once',
      href: '/stamps/batch',
      icon: Layers,
      color: 'bg-primary',
    },
    {
      title: 'New Project',
      description: 'Start tracking a new project',
      href: '/projects',
      icon: FolderKanban,
      color: 'bg-secondary',
    },
    {
      title: 'Add Specification',
      description: 'Track a new specification',
      href: '/specifications',
      icon: GitBranch,
      color: 'bg-accent',
    },
  ]

  const hasLicense = licenses && licenses.length > 0
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
            <p className="mt-1 text-white/80">
              {currentOrg ? (
                <span className="flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  {currentOrg.name}
                </span>
              ) : (
                'Select an organization to get started'
              )}
            </p>
          </div>
          {hasLicense && totalTokens > 0 && (
            <div className="mt-4 md:mt-0 bg-white/10 rounded-lg px-4 py-3">
              <div className="flex items-center">
                <Coins className="h-5 w-5 mr-2" />
                <div>
                  <p className="text-xs text-white/70">Stamp Tokens</p>
                  <p className="text-xl font-bold">{totalTokens.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No Org / No License Prompts */}
      {!currentOrg && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Building2 className="h-6 w-6 text-blue-500 mr-4 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Create or Join an Organization</h3>
              <p className="text-sm text-gray-600 mt-1">
                Organizations help you manage projects, team members, and specifications.
              </p>
              <Link href="/organizations">
                <Button size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {currentOrg && !hasLicense && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start">
            <Award className="h-6 w-6 text-amber-500 mr-4 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900">Add Your Professional License</h3>
              <p className="text-sm text-gray-600 mt-1">
                Add your PE license to start stamping documents and earning tokens.
              </p>
              <Link href="/licenses">
                <Button size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add License
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {currentOrg && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="card-hover h-full">
                  <div
                    className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {currentOrg && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Stamps</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.stamps || 0}
                    </p>
                  </div>
                  <div className="bg-cta/10 p-3 rounded-lg">
                    <Stamp className="h-6 w-6 text-cta" />
                  </div>
                </div>
                <Link
                  href="/stamps"
                  className="text-sm text-primary hover:underline mt-3 inline-block"
                >
                  View all stamps
                </Link>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.projects || 0}
                    </p>
                  </div>
                  <div className="bg-secondary/10 p-3 rounded-lg">
                    <FolderKanban className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <Link
                  href="/projects"
                  className="text-sm text-primary hover:underline mt-3 inline-block"
                >
                  View projects
                </Link>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Specifications</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.specifications || 0}
                    </p>
                  </div>
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <GitBranch className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <Link
                  href="/specifications"
                  className="text-sm text-primary hover:underline mt-3 inline-block"
                >
                  View specs
                </Link>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Compliance Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.compliance?.percentage || 0}%
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-3 rounded-lg',
                      (stats?.compliance?.percentage || 0) >= 90
                        ? 'bg-green-100'
                        : (stats?.compliance?.percentage || 0) >= 70
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                    )}
                  >
                    <ClipboardCheck
                      className={cn(
                        'h-6 w-6',
                        (stats?.compliance?.percentage || 0) >= 90
                          ? 'text-green-600'
                          : (stats?.compliance?.percentage || 0) >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      )}
                    />
                  </div>
                </div>
                <Link
                  href="/compliance"
                  className="text-sm text-primary hover:underline mt-3 inline-block"
                >
                  View compliance
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compliance Alert */}
      {currentOrg && stats && stats.compliance && stats.compliance.total > 0 && stats.compliance.percentage < 100 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Compliance Attention Needed</h3>
              <p className="text-sm text-gray-600 mt-1">
                {stats.compliance.total - stats.compliance.compliant} project-specification link
                {stats.compliance.total - stats.compliance.compliant !== 1 ? 's' : ''} need
                review.
              </p>
              <Link href="/compliance">
                <Button size="sm" variant="outline" className="mt-3">
                  Review Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {currentOrg && stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="card divide-y divide-gray-100">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center">
                  {activity.type === 'stamp' && (
                    <Stamp className="h-4 w-4 text-cta mr-3" />
                  )}
                  {activity.type === 'document' && (
                    <FileText className="h-4 w-4 text-secondary mr-3" />
                  )}
                  {activity.type === 'spec_change' && (
                    <GitBranch className="h-4 w-4 text-accent mr-3" />
                  )}
                  {activity.type === 'project' && (
                    <FolderKanban className="h-4 w-4 text-primary mr-3" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.title}</p>
                  </div>
                  <span className="text-xs text-gray-400 ml-4">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
