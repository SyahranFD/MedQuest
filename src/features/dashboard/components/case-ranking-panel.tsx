import { Skeleton } from '@/components/ui/skeleton'
import { useCaseStats } from '../use-dashboard-data'
import { useDt } from '../use-dt'
import { DifficultyMark, ModeLabel } from './badges'
import { Panel, PanelError } from './panel'

export function CaseRankingPanel() {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useCaseStats()
  const rows = data?.slice().sort((a, b) => a.hardestRank - b.hardestRank)
  return (
    <Panel title={dt('cases.title')} description={dt('cases.desc')}>
      {isPending && (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {rows && (
        <ol className="-mx-2 flex flex-col">
          {rows.map((r) => (
            <li key={r.caseId} className="grid h-14 grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 rounded-row px-2 hover:bg-hover">
              <span className="text-body-s text-ink-3 tabular-nums" aria-label={dt('cases.rank', { n: r.hardestRank })}>
                {r.hardestRank}
              </span>
              <div className="flex min-w-0 flex-col">
                <p className="truncate text-body-s font-medium text-ink-1">{r.title}</p>
                <p className="flex flex-wrap items-center gap-x-3">
                  <ModeLabel mode={r.mode} />
                  <DifficultyMark difficulty={r.difficulty} />
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-5 text-right text-meta text-ink-3">
                <div>
                  <dt>{dt('cases.avg')}</dt>
                  <dd className="text-body-s font-medium text-ink-1 tabular-nums">{r.averagePercent}</dd>
                </div>
                <div>
                  <dt>{dt('cases.pass')}</dt>
                  <dd className="text-body-s font-medium text-ink-1 tabular-nums">{r.passRate}%</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
