import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DosenShell } from '@/components/shell/dosen-shell'

export const Route = createFileRoute('/dosen')({
  staticData: { title: 'nav.dashboard' },
  component: () => (
    <DosenShell>
      <Outlet />
    </DosenShell>
  ),
})
