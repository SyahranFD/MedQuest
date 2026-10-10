import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCase } from '@/features/cases/repository'
import { BriefPage } from '@/features/simulator/brief-page'

export const Route = createFileRoute('/app/kasus/$caseId')({
  staticData: { title: 'simulator.crumb.brief' },
  loader: async ({ params }) => {
    if (!(await getCase(params.caseId))) throw notFound()
  },
  component: function BriefRoute() {
    const { caseId } = Route.useParams()
    return <BriefPage caseId={caseId} />
  },
})
