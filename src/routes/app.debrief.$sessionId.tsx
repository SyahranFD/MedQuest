import { createFileRoute } from '@tanstack/react-router'
import { DebriefPage } from '@/features/simulator/debrief-page'

export const Route = createFileRoute('/app/debrief/$sessionId')({
  staticData: { title: 'simulator.crumb.debrief' },
  component: function DebriefRoute() {
    const { sessionId } = Route.useParams()
    return <DebriefPage sessionId={sessionId} />
  },
})
