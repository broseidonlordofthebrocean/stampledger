'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import {
  Bell,
  X,
  AlertCircle,
  GitBranch,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'spec_change' | 'compliance_alert' | 'stamp_complete' | 'milestone_reached' | 'org_invite'
  title: string
  message: string
  isRead: boolean
  projectId?: string
  specId?: string
  createdAt: string
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { token, currentOrg } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (isOpen && currentOrg) {
      fetchNotifications()
    }
  }, [isOpen, currentOrg])

  const fetchNotifications = async () => {
    if (!token || !currentOrg) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?orgId=${currentOrg.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!token) return
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!token || !currentOrg) return
    try {
      await fetch(`/api/notifications/read-all?orgId=${currentOrg.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'spec_change':
        return <GitBranch className="h-5 w-5 text-blue-500" />
      case 'compliance_alert':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case 'stamp_complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'milestone_reached':
        return <CheckCircle2 className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                You'll be notified about spec changes and compliance updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                  className={cn(
                    'px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer',
                    !notification.isRead && 'bg-blue-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p
                          className={cn(
                            'text-sm font-medium text-gray-900',
                            !notification.isRead && 'font-semibold'
                          )}
                        >
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {(notification.projectId || notification.specId) && (
                        <div className="flex gap-3 mt-2">
                          {notification.projectId && (
                            <Link
                              href={`/projects/${notification.projectId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline"
                            >
                              View Project
                            </Link>
                          )}
                          {notification.specId && (
                            <Link
                              href={`/specifications/${notification.specId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline"
                            >
                              View Spec
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Bell icon button with badge for header
export function NotificationsBell({ onClick, unreadCount }: { onClick: () => void; unreadCount?: number }) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-white/70 hover:text-white transition-colors"
    >
      <Bell className="h-5 w-5" />
      {unreadCount && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
