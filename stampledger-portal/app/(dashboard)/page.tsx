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
  FolderKanban,
  AlertCircle,
  Coins,
  ClipboardCheck,
  Award,
  Building2,
  Layers,
  Sparkles,
  TrendingUp,
  ChevronRight,
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
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Batch Stamp',
      description: 'Stamp multiple projects at once',
      href: '/stamps/batch',
      icon: Layers,
      gradient: 'from-primary to-primary-light',
    },
    {
      title: 'New Project',
      description: 'Start tracking a new project',
      href: '/projects',
      icon: FolderKanban,
      gradient: 'from-secondary to-secondary-light',
    },
    {
      title: 'Add Specification',
      description: 'Track a new specification',
      href: '/specifications',
      icon: GitBranch,
      gradient: 'from-accent to-accent-light',
    },
  ]

  const hasLicense = licenses && licenses.length > 0
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl gradient-hero p-8">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-white/70">
              {currentOrg ? (
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {currentOrg.name}
                </span>
              ) : (
                'Select an organization to get started'
              )}
            </p>
          </div>
          {hasLicense && totalTokens > 0 && (
            <div className="mt-6 md:mt-0 glass-dark rounded-xl px-5 py-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">Stamp Tokens</p>
                  <p className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Cards */}
      {!currentOrg && (
        <div className="card-elevated border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Create or Join an Organization</h3>
              <p className="text-muted-foreground mt-1">
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
        <div className="card-elevated border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Award className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Add Your Professional License</h3>
              <p className="text-muted-foreground mt-1">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="group card-hover h-full relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div
                    className={`bg-gradient-to-br ${action.gradient} w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-sm`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  <ChevronRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {currentOrg && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <Link href="/compliance" className="text-sm text-primary hover:text-primary-light transition-colors flex items-center gap-1">
              View all metrics
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-8 bg-muted rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/stamps" className="bg-card rounded-lg border border-border p-6hover:shadow-md hover:border-border transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Stamps</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats?.stamps || 0}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-xl group-hover:bg-orange-100 transition-colors">
                    <Stamp className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    View all stamps
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>

              <Link href="/projects" className="bg-card rounded-lg border border-border p-6hover:shadow-md hover:border-border transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats?.projects || 0}
                    </p>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-xl group-hover:bg-teal-100 transition-colors">
                    <FolderKanban className="h-6 w-6 text-teal-500" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    View projects
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>

              <Link href="/specifications" className="bg-card rounded-lg border border-border p-6hover:shadow-md hover:border-border transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Specifications</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats?.specifications || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-100 transition-colors">
                    <GitBranch className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    View specs
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>

              <Link href="/compliance" className="bg-card rounded-lg border border-border p-6hover:shadow-md hover:border-border transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                    <p className="text-3xl font-bold text-foreground mt-2">
                      {stats?.compliance?.percentage || 100}%
                    </p>
                  </div>
                  <div
                    className={cn(
                      'p-3 rounded-xl transition-colors',
                      (stats?.compliance?.percentage || 100) >= 90
                        ? 'bg-green-50 group-hover:bg-green-100'
                        : (stats?.compliance?.percentage || 0) >= 70
                        ? 'bg-amber-50 group-hover:bg-amber-100'
                        : 'bg-destructive/10 group-hover:bg-destructive/10'
                    )}
                  >
                    <ClipboardCheck
                      className={cn(
                        'h-6 w-6',
                        (stats?.compliance?.percentage || 100) >= 90
                          ? 'text-green-500'
                          : (stats?.compliance?.percentage || 0) >= 70
                          ? 'text-amber-500'
                          : 'text-red-500'
                      )}
                    />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    View compliance
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Compliance Alert */}
      {currentOrg && stats && stats.compliance && stats.compliance.total > 0 && stats.compliance.percentage < 100 && (
        <div className="bg-card rounded-lg border border-border p-6border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Compliance Attention Needed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.compliance.total - stats.compliance.compliant} project-specification link
                {stats.compliance.total - stats.compliance.compliant !== 1 ? 's' : ''} need
                review to ensure your projects are using the latest specifications.
              </p>
              <Link href="/compliance">
                <Button size="sm" variant="outline" className="mt-4 border-amber-300 hover:bg-amber-100">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="divide-y divide-border">
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center gap-4 py-4",
                    index === 0 && "pt-0",
                    index === stats.recentActivity.length - 1 && "pb-0"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    activity.type === 'stamp' && "bg-orange-50",
                    activity.type === 'document' && "bg-blue-50",
                    activity.type === 'spec_change' && "bg-green-50",
                    activity.type === 'project' && "bg-primary/10"
                  )}>
                    {activity.type === 'stamp' && (
                      <Stamp className="h-4 w-4 text-orange-500" />
                    )}
                    {activity.type === 'document' && (
                      <FileText className="h-4 w-4 text-blue-500" />
                    )}
                    {activity.type === 'spec_change' && (
                      <GitBranch className="h-4 w-4 text-green-500" />
                    )}
                    {activity.type === 'project' && (
                      <FolderKanban className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
