import type { ReactNode } from 'react'
import { dosenNav } from './nav'
import { ShellFrame } from './shell-frame'

/** Lecturer surface (/dosen): same family as AppShell with its own nav. */
export function DosenShell({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <ShellFrame nav={dosenNav} area="nav.lecturerApp" actions={actions}>
      {children}
    </ShellFrame>
  )
}
