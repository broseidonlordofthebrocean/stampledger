import {
  LayoutDashboard,
  Stamp,
  FileText,
  GitBranch,
  FolderKanban,
  Layers,
  ClipboardCheck,
  Puzzle,
  Shield,
  Building2,
  Award,
  Key,
  BarChart3,
  Users,
  Landmark,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stamps', label: 'Stamps', icon: Stamp },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/programs', label: 'Programs', icon: Layers },
  { href: '/specifications', label: 'Master Specs', icon: GitBranch },
  { href: '/compliance', label: 'Compliance', icon: ClipboardCheck },
  { href: '/integrations', label: 'Integrations', icon: Puzzle },
]

export const settingsNavItems: NavItem[] = [
  { href: '/settings', label: 'Account & Security', icon: Shield },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/licenses', label: 'Licenses', icon: Award },
  { href: '/settings/api-keys', label: 'API Keys', icon: Key },
]

export const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orgs', label: 'Organizations', icon: Building2 },
  { href: '/admin/licenses', label: 'Licenses', icon: Award },
  { href: '/admin/municipality', label: 'Municipality', icon: Landmark },
]
