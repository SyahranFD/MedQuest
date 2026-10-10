import { createFileRoute, notFound } from '@tanstack/react-router'
import { AppShell } from '@/components/shell/app-shell'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { EmptyState } from '@/components/page/empty-state'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/lab/shell')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  staticData: { title: 'nav.cases' },
  component: () => (
    <AppShell actions={<Button size="sm" variant="secondary">Aksi</Button>}>
      <PageBody>
        <PageHeader title="Kasus" description="Pratinjau AppShell di rute dev." />
        <EmptyState action={<Button>Mulai kasus</Button>} />
      </PageBody>
    </AppShell>
  ),
})
