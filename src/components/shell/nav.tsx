import { ChartNoAxesColumn, ClipboardList, FolderOpen, History, Stethoscope, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CoreKey, MessageKey } from '@/lib/i18n'

// Nav icon weight and size live here so every shell draws them the same way (CLAUDE.md section 8).
export const NAV_ICON_STROKE = 1.75
export const NAV_ICON_SIZE = 20

export interface NavItem {
  /** i18n key of the label (a content noun, not "Home"). */
  label: CoreKey
  /** Route path. Typed loosely so shells can link to routes other agents add later. */
  to: string
  icon: LucideIcon
  /** Active only on an exact path match (for index routes such as /app). */
  exact?: boolean
}

export interface MarketingLink {
  label: MessageKey
  to: '/'
  hash: string
}

export const marketingLinks: readonly MarketingLink[] = [
  { label: 'nav.features', to: '/', hash: 'fitur' },
  { label: 'nav.how', to: '/', hash: 'cara-kerja' },
  { label: 'landing.nav.institutions', to: '/', hash: 'institusi' },
  { label: 'landing.nav.faq', to: '/', hash: 'faq' },
]

export const appNav: readonly NavItem[] = [
  { label: 'nav.progress', to: '/app', icon: ChartNoAxesColumn, exact: true },
  { label: 'nav.cases', to: '/app/kasus', icon: Stethoscope },
  { label: 'nav.history', to: '/app/riwayat', icon: History },
]

export const dosenNav: readonly NavItem[] = [
  { label: 'nav.dashboard', to: '/dosen', icon: ClipboardList, exact: true },
  { label: 'nav.students', to: '/dosen/mahasiswa', icon: Users },
  { label: 'nav.library', to: '/dosen/perpustakaan', icon: FolderOpen },
]

export const footerLegalLinks: readonly { label: CoreKey; to: string }[] = [
  { label: 'footer.terms', to: '/syarat' },
  { label: 'footer.privacy', to: '/privasi' },
]
