import { Skeleton } from '@/components/ui/skeleton'
import { useCaseStats } from '../use-dashboard-data'
import { useDt } from '../use-dt'
import { DifficultyMark, ModeBadge } from './badges'
import { Panel, PanelError } from './panel'

export function CaseRankingPanel() {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useCaseStats()
  const rows = data?.slice().sort((a, b) => a.hardestRank - b.hardestRank)
  return (
    <Panel title={dt('cases.title')} description={dt('cases.desc')}>
      {isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {rows && (
        <ol className="flex flex-col divide-y divide-line">
          {rows.map((r) => {
            return (
              <li key={r.caseId} className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                <span className="font-display text-heading-card font-semibold text-ink-4 tabular-nums" aria-label={dt('cases.rank', { n: r.hardestRank })}>
                  {r.hardestRank}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-body-s font-semibold text-ink-1">{r.title}</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <ModeBadge mode={r.mode} />
                    <DifficultyMark difficulty={r.difficulty} />
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 text-right text-label text-ink-muted">
                  <div>
                    <dt>{dt('cases.avg')}</dt>
                    <dd className="text-body-s font-semibold text-ink-1 tabular-nums">{r.averagePercent}</dd>
                  </div>
                  <div>
                    <dt>{dt('cases.pass')}</dt>
                    <dd className="text-body-s font-semibold text-ink-1 tabular-nums">{r.passRate}%</dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
