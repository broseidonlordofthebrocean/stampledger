'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { mainNavItems, settingsNavItems, adminNavItems } from '@/lib/nav-config'
import {
  Shield,
  Building2,
  Check,
  Coins,
  User,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user, logout, organizations, currentOrg, switchOrg, totalTokens, isAdmin } = useAuth()

  const activeOrgs = organizations.filter((o) => o.status === 'active')

  const handleOrgSwitch = (orgId: string) => {
    switchOrg(orgId)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">StampLedger</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          {/* Org selector */}
          {activeOrgs.length > 0 && (
            <div className="px-3 py-3 border-b border-border space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Organization
              </p>
              {activeOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSwitch(org.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                    currentOrg?.id === org.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                    <span className="truncate font-medium">{org.name}</span>
                  </div>
                  {currentOrg?.id === org.id && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Main nav */}
          <nav className="px-3 py-3 space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 mr-3",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )} />
                {item.label}
              </Link>
            ))}

            {/* Settings */}
            <Separator className="my-3" />
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Settings
            </p>
            {settingsNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 mr-3",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )} />
                {item.label}
              </Link>
            ))}

            {/* Admin */}
            {isAdmin && (
              <>
                <Separator className="my-3" />
                <p className="px-3 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                  Admin
                </p>
                {adminNavItems.map((item) => {
                  const active = item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                        active
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200'
                          : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 mr-3",
                        active ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                      )} />
                      {item.label}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3 bg-background space-y-2">
          {totalTokens > 0 && (
            <div className="flex items-center justify-between px-3 py-2 bg-muted rounded-md">
              <div className="flex items-center text-muted-foreground text-sm">
                <Coins className="h-4 w-4 mr-2" />
                <span>Tokens</span>
              </div>
              <span className="font-semibold text-foreground">
                {totalTokens.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
