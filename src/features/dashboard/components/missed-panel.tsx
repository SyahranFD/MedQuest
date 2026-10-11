import { Skeleton } from '@/components/ui/skeleton'
import { useMissedCriteria } from '../use-dashboard-data'
import { useDt } from '../use-dt'
import { CiteChip } from './badges'
import { Panel, PanelError } from './panel'

export function MissedPanel() {
  const { dt, dimension } = useDt()
  const { data, isPending, isError, refetch } = useMissedCriteria()
  return (
    <Panel title={dt('missed.title')} description={dt('missed.desc')}>
      {isPending && (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {data && (
        <ol className="-mx-2 flex flex-col">
          {data.map((m, i) => (
            <li key={`${m.caseId}-${m.criterionId}`} className="grid min-h-14 grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 rounded-row px-2 py-2 hover:bg-hover">
              <span className="text-body-s text-ink-3 tabular-nums" aria-hidden="true">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-body-s font-medium text-ink-1">{m.label}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-3">
                  {m.caseTitle}, {dimension(m.dimension)}
                  {m.cite && <CiteChip cite={m.cite} />}
                </div>
              </div>
              <p className="text-right text-meta text-ink-3">
                <span className="block text-body-s font-medium text-ink-1 tabular-nums">{dt('missed.rate', { n: m.missRate })}</span>
                {dt('missed.attempts', { n: m.attempts })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
