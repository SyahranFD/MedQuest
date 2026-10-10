import { createFileRoute } from '@tanstack/react-router'
import { HistoryPage } from '@/features/history/history-page'

export const Route = createFileRoute('/app/riwayat')({
  staticData: { title: 'nav.history' },
  component: HistoryPage,
})
