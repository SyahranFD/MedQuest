import type { ReactNode } from 'react'
import { appNav } from './nav'
import { ShellFrame } from './shell-frame'

/** Student surface (/app): sidebar on desktop, bottom nav on mobile, breadcrumbs, route progress. */
export function AppShell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <ShellFrame nav={appNav} area="nav.studentApp" actions={actions}>
      {children}
    </ShellFrame>
  )
}
