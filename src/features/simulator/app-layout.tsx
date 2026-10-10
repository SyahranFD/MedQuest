import { Outlet, useRouterState } from '@tanstack/react-router'
import { AppShell } from '@/components/shell/app-shell'
import { OnboardingDialog } from './onboarding-dialog'
import { SettingsButton } from './settings-dialog'

/**
 * Layout of every /app route: the student shell and the first-visit onboarding. The encounter
 * (/app/sesi/...) is immersive and renders without the sidebar.
 */
export function AppLayout() {
  const immersive = useRouterState({ select: (s) => s.location.pathname.startsWith('/app/sesi/') })
  if (immersive) return <Outlet />
  return (
    <>
      <AppShell actions={<SettingsButton />}>
        <Outlet />
      </AppShell>
      <OnboardingDialog />
    </>
  )
}
