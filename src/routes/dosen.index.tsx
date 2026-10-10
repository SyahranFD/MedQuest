import { createFileRoute } from '@tanstack/react-router'
import { OverviewPage } from '@/features/dashboard/overview-page'

export const Route = createFileRoute('/dosen/')({
  component: OverviewPage,
})
