'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Activity,
  DollarSign,
  MapPin,
  Building2,
  ChevronUp,
  ChevronDown,
  Filter,
  Loader2,
  TrendingUp,
  Droplets,
  Zap,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  pipelineProjects,
  municipalities,
  PROJECT_TYPE_LABELS,
  type PipelineProject,
} from '@/lib/pipeline-data'

type SortField = 'signalScore' | 'budgetHigh' | 'municipality' | 'projectType'
type SortDir = 'asc' | 'desc'
type ViewTab = 'projects' | 'municipalities'

const PROJECT_TYPE_ICONS: Record<string, string> = {
  cyber_security: '🔒',
  lift_station: '⬆️',
  storage_tank: '🏗️',
  scada: '📡',
  collection_system: '🔄',
  wwtp_upgrade: '🏭',
  biosolids: '♻️',
  well_facility: '💧',
  wtp_upgrade: '🏭',
  water_main: '🚰',
}

function formatBudget(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function signalColor(score: number): string {
  if (score >= 90) return 'bg-green-500'
  if (score >= 75) return 'bg-emerald-400'
  if (score >= 60) return 'bg-amber-400'
  if (score >= 50) return 'bg-orange-400'
  return 'bg-red-400'
}

function signalBadge(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-700'
  if (score >= 75) return 'bg-emerald-100 text-emerald-700'
  if (score >= 60) return 'bg-amber-100 text-amber-700'
  if (score >= 50) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export default function AdminPipelinePage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [viewTab, setViewTab] = useState<ViewTab>('projects')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [scoreMin, setScoreMin] = useState<number>(0)
  const [sortField, setSortField] = useState<SortField>('signalScore')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, authLoading, router])

  const projectTypes = useMemo(() => {
    const types = new Set(pipelineProjects.map((p) => p.projectType))
    return Array.from(types).sort()
  }, [])

  const filteredProjects = useMemo(() => {
    let result = [...pipelineProjects]
    if (typeFilter) result = result.filter((p) => p.projectType === typeFilter)
    if (scoreMin > 0) result = result.filter((p) => p.signalScore >= scoreMin)

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'signalScore':
          cmp = a.signalScore - b.signalScore
          break
        case 'budgetHigh':
          cmp = a.budgetHigh - b.budgetHigh
          break
        case 'municipality':
          cmp = a.municipality.localeCompare(b.municipality)
          break
        case 'projectType':
          cmp = a.projectType.localeCompare(b.projectType)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
    return result
  }, [typeFilter, scoreMin, sortField, sortDir])

  const municipalityStats = useMemo(() => {
    return municipalities
      .map((m) => {
        const projects = pipelineProjects.filter(
          (p) => p.municipality.toLowerCase() === m.name.toLowerCase()
        )
        const totalBudgetLow = projects.reduce((s, p) => s + p.budgetLow, 0)
        const totalBudgetHigh = projects.reduce((s, p) => s + p.budgetHigh, 0)
        const topSignal = projects.length > 0 ? Math.max(...projects.map((p) => p.signalScore)) : 0
        return { ...m, projects: projects.length, totalBudgetLow, totalBudgetHigh, topSignal }
      })
      .filter((m) => m.projects > 0)
      .sort((a, b) => b.topSignal - a.topSignal)
  }, [])

  // Summary stats
  const totalProjects = pipelineProjects.length
  const totalBudgetLow = pipelineProjects.reduce((s, p) => s + p.budgetLow, 0)
  const totalBudgetHigh = pipelineProjects.reduce((s, p) => s + p.budgetHigh, 0)
  const uniqueMunicipalities = new Set(pipelineProjects.map((p) => p.municipality.toLowerCase())).size
  const avgSignal = Math.round(pipelineProjects.reduce((s, p) => s + p.signalScore, 0) / totalProjects)

  // Type breakdown
  const typeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; budgetHigh: number }>()
    pipelineProjects.forEach((p) => {
      const existing = map.get(p.projectType) || { count: 0, budgetHigh: 0 }
      map.set(p.projectType, { count: existing.count + 1, budgetHigh: existing.budgetHigh + p.budgetHigh })
    })
    return Array.from(map.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.budgetHigh - a.budgetHigh)
  }, [])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDir === 'desc' ? (
      <ChevronDown className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronUp className="h-3 w-3 inline ml-1" />
    )
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
            <Activity className="h-8 w-8" />
            Pipeline Intelligence
          </h1>
          <p className="mt-2 text-white/70">
            Wisconsin municipality infrastructure projects — Feb 2026
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalProjects}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <Wrench className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Municipalities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{uniqueMunicipalities}</p>
            </div>
            <div className="bg-teal-50 p-2.5 rounded-xl">
              <MapPin className="h-5 w-5 text-teal-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Budget Range</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatBudget(totalBudgetLow)} – {formatBudget(totalBudgetHigh)}
              </p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-xl">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Signal</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgSignal}</p>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Type Breakdown */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Budget by Project Type</h3>
        <div className="space-y-3">
          {typeBreakdown.map((t) => (
            <div key={t.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{PROJECT_TYPE_ICONS[t.type] || '📋'}</span>
                  {PROJECT_TYPE_LABELS[t.type] || t.type}
                  <span className="text-gray-400">({t.count})</span>
                </span>
                <span className="text-sm font-medium text-gray-900">{formatBudget(t.budgetHigh)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(t.budgetHigh / typeBreakdown[0].budgetHigh) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewTab('projects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewTab === 'projects' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Projects ({filteredProjects.length})
        </button>
        <button
          onClick={() => setViewTab('municipalities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewTab === 'municipalities' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Municipalities ({municipalityStats.length})
        </button>
      </div>

      {/* Projects View */}
      {viewTab === 'projects' && (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">Filters:</span>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Types</option>
                {projectTypes.map((t) => (
                  <option key={t} value={t}>
                    {PROJECT_TYPE_LABELS[t] || t}
                  </option>
                ))}
              </select>
              <select
                value={scoreMin}
                onChange={(e) => setScoreMin(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={0}>Min Signal: Any</option>
                <option value={50}>Signal 50+</option>
                <option value={60}>Signal 60+</option>
                <option value={70}>Signal 70+</option>
                <option value={80}>Signal 80+</option>
                <option value={90}>Signal 90+</option>
              </select>
              {(typeFilter || scoreMin > 0) && (
                <button
                  onClick={() => { setTypeFilter(''); setScoreMin(0) }}
                  className="text-xs text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Projects Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th
                      className="text-left font-medium text-gray-500 pb-3 cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('signalScore')}
                    >
                      Signal <SortIcon field="signalScore" />
                    </th>
                    <th className="text-left font-medium text-gray-500 pb-3">Project</th>
                    <th
                      className="text-left font-medium text-gray-500 pb-3 cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('municipality')}
                    >
                      Municipality <SortIcon field="municipality" />
                    </th>
                    <th
                      className="text-left font-medium text-gray-500 pb-3 cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('projectType')}
                    >
                      Type <SortIcon field="projectType" />
                    </th>
                    <th
                      className="text-right font-medium text-gray-500 pb-3 cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('budgetHigh')}
                    >
                      Budget Range <SortIcon field="budgetHigh" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProjects.map((project, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${signalBadge(project.signalScore)}`}>
                          {project.signalScore}
                        </span>
                      </td>
                      <td className="py-3">
                        <p className="font-medium text-gray-900 max-w-[300px] truncate" title={project.title}>
                          {project.title}
                        </p>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="text-gray-900">{project.municipality}</p>
                          <p className="text-xs text-gray-400">{project.county} County</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          {PROJECT_TYPE_ICONS[project.projectType] || '📋'} {PROJECT_TYPE_LABELS[project.projectType] || project.projectType}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span className="text-gray-600">
                          {formatBudget(project.budgetLow)} – {formatBudget(project.budgetHigh)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Municipalities View */}
      {viewTab === 'municipalities' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-medium text-gray-500 pb-3">Municipality</th>
                  <th className="text-left font-medium text-gray-500 pb-3">County</th>
                  <th className="text-right font-medium text-gray-500 pb-3">Population</th>
                  <th className="text-center font-medium text-gray-500 pb-3">Projects</th>
                  <th className="text-center font-medium text-gray-500 pb-3">Top Signal</th>
                  <th className="text-right font-medium text-gray-500 pb-3">Budget (High Est.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {municipalityStats.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{m.name}</td>
                    <td className="py-3 text-gray-600">{m.county}</td>
                    <td className="py-3 text-right text-gray-600">
                      {m.population ? m.population.toLocaleString() : '—'}
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {m.projects}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${signalBadge(m.topSignal)}`}>
                        {m.topSignal}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600 whitespace-nowrap">
                      {formatBudget(m.totalBudgetHigh)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
