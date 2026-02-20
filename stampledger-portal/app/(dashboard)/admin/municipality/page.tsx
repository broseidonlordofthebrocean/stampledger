'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Landmark,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  ArrowRightLeft,
  BarChart3,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface MunicipalityStats {
  totalStamps: number
  activeStamps: number
  revokedStamps: number
  supersededStamps: number
  totalVerifications: number
  recentVerifications: number
  expiredLicenses: number
  expiredInsurance: number
}

interface StampRecord {
  id: string
  status: string
  projectName: string | null
  jurisdictionId: string
  documentHash: string
  createdAt: string
  peName: string
  licenseNumber: string | null
  licenseExpired: boolean
  insuranceExpired: boolean
  scopeNotes: string | null
}

export default function MunicipalityPage() {
  const { token, isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<MunicipalityStats | null>(null)
  const [stamps, setStamps] = useState<StampRecord[]>([])
  const [alerts, setAlerts] = useState<{ type: string; message: string; stampId: string }[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (token && isAdmin) fetchData()
  }, [token, isAdmin])

  const fetchData = async () => {
    if (!token) return
    setLoading(true)

    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const statsData = statsRes.ok ? await statsRes.json() : null

      // Fetch all stamps with expanded data
      const stampsRes = await fetch('/api/admin/municipality/stamps', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const stampsData = stampsRes.ok ? await stampsRes.json() : { stamps: [], alerts: [] }

      if (statsData) {
        const supersededCount = (stampsData.stamps || []).filter((s: any) => s.status === 'superseded').length
        setStats({
          totalStamps: statsData.stamps?.total || 0,
          activeStamps: statsData.stamps?.active || 0,
          revokedStamps: statsData.stamps?.revoked || 0,
          supersededStamps: supersededCount,
          totalVerifications: statsData.verifications?.total || 0,
          recentVerifications: 0,
          expiredLicenses: stampsData.alerts?.filter((a: any) => a.type === 'license_expired').length || 0,
          expiredInsurance: stampsData.alerts?.filter((a: any) => a.type === 'insurance_expired').length || 0,
        })
      }

      setStamps(stampsData.stamps || [])
      setAlerts(stampsData.alerts || [])
    } catch (error) {
      console.error('Failed to fetch municipality data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStamps = stamps.filter((s) => {
    const matchesSearch = !search ||
      s.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.peName.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
        <p className="text-gray-500">You need admin access to view this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Municipality Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Stamp verification oversight & compliance monitoring
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Active Stamps</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.activeStamps}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">Verifications</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalVerifications}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-600">Expired Licenses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.expiredLicenses}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Expired Insurance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.expiredInsurance}</p>
          </div>
        </div>
      )}

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Smart Alerts ({alerts.length})
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  alert.type === 'license_expired'
                    ? 'bg-red-50 text-red-700'
                    : alert.type === 'insurance_expired'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-blue-50 text-blue-700'
                }`}
              >
                <span>{alert.message}</span>
                <a
                  href={`/stamps/${alert.stampId}`}
                  className="text-xs underline hover:no-underline ml-2"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stamp List with Filters */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by project, stamp ID, or engineer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'revoked', 'superseded'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y">
          {filteredStamps.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No stamps found matching your criteria.
            </div>
          ) : (
            filteredStamps.map((stamp) => (
              <div key={stamp.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {stamp.projectName || 'Unnamed Project'}
                      </p>
                      {stamp.status === 'active' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                      )}
                      {stamp.status === 'revoked' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Revoked</span>
                      )}
                      {stamp.status === 'superseded' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3" />
                          Superseded
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {stamp.peName} {stamp.licenseNumber ? `(#${stamp.licenseNumber})` : ''}
                      {' '} &middot; {stamp.jurisdictionId.replace(/-/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ID: {stamp.id} &middot; {new Date(stamp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stamp.licenseExpired && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1" title="License expired">
                        <AlertTriangle className="h-3 w-3" />
                        License
                      </span>
                    )}
                    {stamp.insuranceExpired && (
                      <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded flex items-center gap-1" title="Insurance expired">
                        <Shield className="h-3 w-3" />
                        Insurance
                      </span>
                    )}
                    <a
                      href={`/api/verify/${stamp.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cta hover:underline"
                    >
                      Verify
                    </a>
                  </div>
                </div>
                {stamp.scopeNotes && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                    Scope: {stamp.scopeNotes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
