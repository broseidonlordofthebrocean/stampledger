'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2,
  Plus,
  Users,
  Settings,
  Mail,
  MoreVertical,
  Crown,
  Shield,
  UserPlus,
  X,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrgMember {
  id: string
  userId: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  status: string
  joinedAt: string
}

interface OrgDetails {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  members: OrgMember[]
  memberCount: number
  projectCount: number
  role: string
}

export default function OrganizationsPage() {
  const { token, organizations, currentOrg, refreshUser } = useAuth()
  const [selectedOrg, setSelectedOrg] = useState<OrgDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', description: '' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrg) {
      fetchOrgDetails(currentOrg.id)
    }
  }, [currentOrg])

  const fetchOrgDetails = async (orgId: string) => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orgs/${orgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedOrg(data)
      }
    } catch (err) {
      console.error('Failed to fetch org details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')

    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create organization')
      }

      setShowCreateModal(false)
      setCreateForm({ name: '', slug: '', description: '' })
      setSuccess('Organization created successfully')
      await refreshUser()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !selectedOrg) return
    setError('')

    try {
      const res = await fetch(`/api/orgs/${selectedOrg.id}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to invite member')
      }

      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
      setSuccess('Invitation sent successfully')
      fetchOrgDetails(selectedOrg.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member')
    }
  }

  const handleRemoveMember = async (membershipId: string) => {
    if (!token || !selectedOrg) return
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const res = await fetch(`/api/orgs/${selectedOrg.id}/members`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ membershipId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      setSuccess('Member removed successfully')
      fetchOrgDetails(selectedOrg.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <Users className="h-4 w-4 text-gray-400" />
    }
  }

  const canManageMembers = selectedOrg?.role === 'owner' || selectedOrg?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-1">Manage your organizations and team members</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Org List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Your Organizations</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {organizations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No organizations yet</p>
                  <p className="text-sm mt-1">Create one to get started</p>
                </div>
              ) : (
                organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => fetchOrgDetails(org.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors',
                      selectedOrg?.id === org.id && 'bg-blue-50'
                    )}
                  >
                    <div className="flex items-center min-w-0">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{org.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{org.role}</p>
                      </div>
                    </div>
                    {getRoleIcon(org.role)}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Org Details */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            </div>
          ) : selectedOrg ? (
            <div className="space-y-6">
              {/* Org Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedOrg.name}</h2>
                    <p className="text-gray-500 mt-1">{selectedOrg.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {selectedOrg.memberCount} members
                      </span>
                      <span>Slug: {selectedOrg.slug}</span>
                    </div>
                  </div>
                  {selectedOrg.role === 'owner' && (
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Team Members</h3>
                  {canManageMembers && (
                    <Button size="sm" onClick={() => setShowInviteModal(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  )}
                </div>
                <div className="divide-y divide-gray-200">
                  {selectedOrg.members.map((member) => (
                    <div
                      key={member.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div className="flex items-center min-w-0">
                        <div className="bg-gray-100 p-2 rounded-full mr-3">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {member.firstName && member.lastName
                              ? `${member.firstName} ${member.lastName}`
                              : member.email}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          {getRoleIcon(member.role)}
                          <span className="capitalize text-gray-600">{member.role}</span>
                        </div>
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs rounded-full',
                            member.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          {member.status}
                        </span>
                        {canManageMembers && member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Select an organization to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Org Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Organization</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Acme Engineering"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL identifier) *
                </label>
                <Input
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="acme-engineering"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="A brief description of your organization"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
