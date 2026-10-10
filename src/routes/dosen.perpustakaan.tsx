import { createFileRoute } from '@tanstack/react-router'
import { CaseCataloguePage } from '@/features/dashboard/case-catalogue-page'

export const Route = createFileRoute('/dosen/perpustakaan')({
  staticData: { title: 'nav.library' },
  component: CaseCataloguePage,
})
