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
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {data && (
        <ol className="flex flex-col divide-y divide-line">
          {data.map((m, i) => (
            <li key={`${m.caseId}-${m.criterionId}`} className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-2 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
              <span className="font-display text-heading-card font-semibold text-ink-4 tabular-nums" aria-hidden="true">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-body font-medium text-ink-1">{m.label}</p>
                <p className="text-body-s text-ink-2">
                  {m.caseTitle}
                  <span className="text-ink-muted">, {dimension(m.dimension)}</span>
                </p>
                {m.cite && (
                  <div>
                    <CiteChip cite={m.cite} />
                  </div>
                )}
              </div>
              <p className="col-start-2 text-body-s text-ink-2 sm:col-start-3 sm:text-right">
                <span className="block font-display text-heading-card font-semibold text-ink-1 tabular-nums">{dt('missed.rate', { n: m.missRate })}</span>
                {dt('missed.attempts', { n: m.attempts })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}
