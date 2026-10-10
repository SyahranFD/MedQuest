import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/simulator/home-page'

export const Route = createFileRoute('/app/')({
  staticData: { title: 'nav.progress' },
  component: HomePage,
})
