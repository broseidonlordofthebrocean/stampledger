'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Stamp,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

interface StampData {
  id: string
  blockchainId: string
  documentHash: string
  jurisdictionId: string
  projectName: string | null
  status: string
  createdAt: string
  documentFilename: string | null
}

export default function StampsPage() {
  const { token } = useAuth()
  const [stamps, setStamps] = useState<StampData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStamps()
  }, [token])

  const fetchStamps = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/stamps', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStamps(data.stamps)
      }
    } catch (error) {
      console.error('Failed to fetch stamps:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStamps = stamps.filter(
    (stamp) =>
      stamp.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      stamp.jurisdictionId.toLowerCase().includes(search.toLowerCase()) ||
      stamp.documentHash.includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-header mb-0">Stamps</h1>
          <p className="text-gray-600">
            Manage your blockchain-verified engineering stamps
          </p>
        </div>
        <Link href="/stamps/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Stamp
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search stamps..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stamps List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredStamps.length === 0 ? (
        <div className="card text-center py-12">
          <Stamp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No stamps yet</h3>
          <p className="text-gray-600 mt-1">
            Create your first blockchain-verified stamp
          </p>
          <Link href="/stamps/create">
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Stamp
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredStamps.map((stamp) => (
            <Link key={stamp.id} href={`/stamps/${stamp.id}`}>
              <div className="card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-lg ${
                        stamp.status === 'active'
                          ? 'bg-accent/10'
                          : 'bg-red-100'
                      }`}
                    >
                      <Stamp
                        className={`h-6 w-6 ${
                          stamp.status === 'active'
                            ? 'text-accent'
                            : 'text-red-500'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {stamp.projectName || 'Untitled Project'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stamp.jurisdictionId} •{' '}
                        {new Date(stamp.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        {stamp.documentHash.slice(0, 16)}...
                        {stamp.documentHash.slice(-16)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {stamp.status === 'active' ? (
                      <span className="flex items-center text-sm text-accent">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-red-500">
                        <XCircle className="h-4 w-4 mr-1" />
                        Revoked
                      </span>
                    )}
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
