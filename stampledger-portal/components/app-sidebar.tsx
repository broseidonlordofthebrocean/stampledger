'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { mainNavItems, settingsNavItems, adminNavItems } from '@/lib/nav-config'
import {
  Shield,
  Building2,
  ChevronDown,
  Check,
  Settings,
  Coins,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, organizations, currentOrg, switchOrg, totalTokens, isAdmin } = useAuth()
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(
    settingsNavItems.some(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))
  )
  const [adminOpen, setAdminOpen] = useState(
    adminNavItems.some(item => item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href))
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOrgSwitch = (orgId: string) => {
    switchOrg(orgId)
    setOrgDropdownOpen(false)
  }

  const activeOrgs = organizations.filter((o) => o.status === 'active')

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-sidebar-border bg-sidebar">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <span className="ml-2.5 text-lg font-semibold text-sidebar-foreground tracking-tight">
            StampLedger
          </span>
        </div>

        {/* Organization Selector */}
        {activeOrgs.length > 0 && (
          <div className="px-3 py-3 border-b border-sidebar-border relative" ref={dropdownRef}>
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm bg-sidebar-accent hover:bg-sidebar-accent/80 rounded-md transition-colors border border-sidebar-border"
            >
              <div className="flex items-center min-w-0">
                <Building2 className="h-4 w-4 text-sidebar-foreground/60 mr-2 flex-shrink-0" />
                <span className="text-sidebar-foreground truncate text-sm font-medium">
                  {currentOrg?.name || 'Select Organization'}
                </span>
              </div>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-sidebar-foreground/50 transition-transform flex-shrink-0",
                orgDropdownOpen && "rotate-180"
              )} />
            </button>

            {orgDropdownOpen && (
              <div className="absolute left-3 right-3 mt-1 bg-popover text-popover-foreground rounded-md shadow-md py-1 z-50 max-h-60 overflow-y-auto border border-border">
                {activeOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrgSwitch(org.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors",
                      currentOrg?.id === org.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center min-w-0">
                      <Building2 className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                      <span className="truncate font-medium">{org.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                        {org.role}
                      </span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
                <Separator className="my-1" />
                <Link
                  href="/organizations"
                  onClick={() => setOrgDropdownOpen(false)}
                  className="flex items-center px-3 py-2 text-sm text-primary hover:bg-accent rounded transition-colors font-medium"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Organizations
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="px-3 py-3 space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 mr-3",
                  isActive(item.href) ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                )} />
                {item.label}
              </Link>
            ))}

            {/* Settings Section */}
            <Separator className="my-3" />
            <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider hover:text-sidebar-foreground/60 transition-colors">
                <span>Settings</span>
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  settingsOpen && "rotate-90"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {settingsNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 mr-3",
                      isActive(item.href) ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                    )} />
                    {item.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Admin Section */}
            {isAdmin && (
              <>
                <Separator className="my-3" />
                <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                    <span>Admin</span>
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      adminOpen && "rotate-90"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {adminNavItems.map((item) => {
                      const active = item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            active
                              ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200'
                              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <item.icon className={cn(
                            "h-4 w-4 mr-3",
                            active ? "text-amber-600 dark:text-amber-400" : "text-sidebar-foreground/50"
                          )} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {totalTokens > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-sidebar-accent rounded-md">
              <div className="flex items-center text-sidebar-foreground/60 text-sm">
                <Coins className="h-4 w-4 mr-2" />
                <span>Tokens</span>
              </div>
              <span className="font-semibold text-sidebar-foreground">
                {totalTokens.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}
