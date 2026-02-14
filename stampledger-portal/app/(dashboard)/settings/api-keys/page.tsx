'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Key,
  Plus,
  Copy,
  CheckCircle,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react'

interface ApiKeyInfo {
  id: string
  keyPrefix: string
  name: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
}

export default function ApiKeysPage() {
  const { token } = useAuth()
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyExpiry, setNewKeyExpiry] = useState('90')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (token) fetchKeys()
  }, [token])

  const fetchKeys = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys)
      }
    } catch (error) {
      console.error('Failed to fetch keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!token || !newKeyName) return
    setCreating(true)

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName,
          expiresInDays: newKeyExpiry ? parseInt(newKeyExpiry, 10) : null,
          scopes: ['read:stamps', 'read:verify', 'read:insurance'],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        fetchKeys()
      }
    } catch (error) {
      console.error('Failed to create key:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setKeys(keys.map(k => k.id === keyId ? { ...k, isActive: false } : k))
      }
    } catch (error) {
      console.error('Failed to revoke key:', error)
    }
  }

  const copyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreatedKey(null)
    setNewKeyName('')
    setNewKeyExpiry('90')
    setCopied(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-1">
            Manage API keys for external integrations
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">API keys enable external access</p>
            <p className="mt-1">
              Use API keys to integrate with insurance verification systems,
              municipality dashboards, or custom workflows. Keys provide read-only
              access to stamp and verification data.
            </p>
          </div>
        </div>
      </div>

      {/* Keys List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No API Keys</h2>
          <p className="text-gray-500 mb-4">
            Create your first API key to enable external integrations.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`bg-white rounded-lg border p-4 ${
                key.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${key.isActive ? 'bg-primary/10' : 'bg-red-100'}`}>
                    <Key className={`h-4 w-4 ${key.isActive ? 'text-primary' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{key.name}</p>
                      {!key.isActive && (
                        <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-gray-500">{key.keyPrefix}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-gray-500">
                    {key.lastUsedAt ? (
                      <p>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                    ) : (
                      <p>Never used</p>
                    )}
                    <p>Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                    {key.expiresAt && (
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {new Date(key.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {key.isActive && (
                    <button
                      onClick={() => handleRevoke(key.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {key.scopes.length > 0 && (
                <div className="mt-2 flex gap-1.5">
                  {key.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {createdKey ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  API Key Created
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-700">
                      Copy this key now. It will not be shown again.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2 mb-4">
                  <code className="flex-1 text-xs font-mono break-all text-gray-800">
                    {createdKey}
                  </code>
                  <button
                    onClick={copyKey}
                    className="p-2 hover:bg-gray-200 rounded-lg flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <Button className="w-full" onClick={closeCreateModal}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create API Key
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Name *
                    </label>
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Insurance Integration"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires In (days)
                    </label>
                    <Input
                      type="number"
                      value={newKeyExpiry}
                      onChange={(e) => setNewKeyExpiry(e.target.value)}
                      placeholder="90"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for no expiration
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <Button variant="outline" onClick={closeCreateModal}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newKeyName || creating}
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Create Key
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
