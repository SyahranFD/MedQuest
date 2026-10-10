import { createFileRoute } from '@tanstack/react-router'
import { EncounterScreen } from '@/features/simulator/encounter-screen'

export const Route = createFileRoute('/app/sesi/$sessionId')({
  staticData: { title: 'simulator.crumb.session' },
  component: function SessionRoute() {
    const { sessionId } = Route.useParams()
    return <EncounterScreen sessionId={sessionId} />
  },
})
