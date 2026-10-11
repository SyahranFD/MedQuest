import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Reveal, RevealGroup } from '@/components/ui/reveal'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/lib/use-page-title'
import { AttentionPanel } from './components/attention-panel'
import { SampleBadge } from './components/badges'
import { CaseRankingPanel } from './components/case-ranking-panel'
import { CompetencyPanel } from './components/competency-panel'
import { KpiSkeleton, KpiStrip } from './components/kpi-strip'
import { MissedPanel } from './components/missed-panel'
import { TrendPanel } from './components/trend-panel'
import { useClassOverview } from './use-dashboard-data'
import { useDt } from './use-dt'

/** /dosen: class overview. */
export function OverviewPage() {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useClassOverview()
  usePageTitle(dt('overview.title'))
  return (
    <PageBody wide className="flex flex-col gap-8">
      <PageHeader
        title={dt('overview.title')}
        description={
          data ? (
            <>
              {dt('overview.desc', {
                faculty: data.meta.faculty,
                program: data.meta.program,
                cohort: data.meta.cohort,
                className: data.meta.className,
              })}
              <SampleBadge />
            </>
          ) : (
            <Skeleton className="h-[1.3125rem] w-80" />
          )
        }
        className="pb-0"
      />
      {isPending && <KpiSkeleton />}
      {isError && <ErrorState title={dt('loadError')} description={dt('loadErrorBody')} onRetry={() => void refetch()} />}
      {data && <KpiStrip kpis={data.kpis} />}

      <AttentionPanel />

      <RevealGroup className="flex flex-col gap-8" stagger={0.06}>
        <Reveal y={12} className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          <TrendPanel />
          <CompetencyPanel />
        </Reveal>
        <Reveal y={12} className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          <CaseRankingPanel />
          <MissedPanel />
        </Reveal>
      </RevealGroup>
      <p className="text-meta text-ink-3">{dt('sample.note')}</p>
    </PageBody>
  )
}
