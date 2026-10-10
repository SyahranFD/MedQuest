import { FlaskConical, LoaderCircle, Plus } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Case, TestCategory } from '@/features/cases/types'
import { requireCase } from '@/features/cases/repository'
import { listResults } from '@/features/session/er-engine'
import { formatClock } from '@/features/session/helpers'
import type { Session, SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { ImagingViewer } from './imaging'
import { useST } from './use-st'

const CATEGORY_ORDER: TestCategory[] = ['bedside', 'lab', 'imaging']

interface OrdersPanelProps {
  caseDef: Case
  session: Session
  patient: SessionPatient
  onOrder: (testId: string) => void
  onOrderPanel: (testIds: string[]) => void
  onMarkSeen: () => void
}

export function OrdersPanel({ caseDef, session, patient, onOrder, onOrderPanel, onMarkSeen }: OrdersPanelProps) {
  const st = useST()
  const results = useMemo(() => listResults(session, patient.id, requireCase), [session, patient.id])
  const ordered = new Set(patient.log.orders.map((o) => o.testId))
  const instant = session.mode === 'poli'
  const unseen = results.filter((r) => r.ready && !r.seen).length

  useEffect(() => {
    if (unseen > 0) onMarkSeen()
  }, [unseen, onMarkSeen])

  return (
    <div className="flex flex-col gap-5" data-testid="orders-panel">
      <section className="flex flex-col gap-2" aria-label={st('orders.results')}>
        <h3 className="flex items-center justify-between text-body-s font-semibold text-ink-1">
          {st('orders.results')}
          <span className="text-label font-medium text-ink-muted tabular-nums">{results.length}</span>
        </h3>
        {results.length === 0 ? (
          <p className="rounded-sm border border-dashed border-line-strong p-3 text-body-s text-ink-muted">
            {st(instant ? 'orders.emptyInstant' : 'orders.empty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.testId} className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3" data-testid="result-card">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-s font-semibold text-ink-1">{r.name}</span>
                  {r.ready ? (
                    r.critical ? (
                      <Badge variant="danger">{st('orders.critical')}</Badge>
                    ) : r.abnormal ? (
                      <Badge variant="warning">{st('orders.abnormal')}</Badge>
                    ) : (
                      <Badge variant="success">{st('orders.normal')}</Badge>
                    )
                  ) : (
                    <Badge variant="neutral">
                      <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      {st('orders.eta', { time: formatClock(Math.max(0, r.readyAtSec - session.nowSec)) })}
                    </Badge>
                  )}
                </div>
                {r.ready && <p className={cn('text-body-s', r.abnormal ? 'font-medium text-ink-1' : 'text-ink-2')}>{r.text}</p>}
                {r.ready && r.imageId && <ImagingViewer imageId={r.imageId} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {caseDef.panels.length > 0 && (
        <section className="flex flex-col gap-2" aria-label={st('orders.panels')}>
          <h3 className="text-body-s font-semibold text-ink-1">{st('orders.panels')}</h3>
          <div className="flex flex-col gap-1.5">
            {caseDef.panels.map((p) => {
              const pending = p.testIds.filter((id) => !ordered.has(id))
              return (
                <Button
                  key={p.id}
                  variant="secondary"
                  disabled={pending.length === 0}
                  onClick={() => onOrderPanel(pending)}
                  className="h-auto min-h-11 justify-between py-2 text-left whitespace-normal"
                >
                  <span className="flex items-center gap-2">
                    <FlaskConical aria-hidden="true" />
                    {p.label}
                  </span>
                  <span className="text-label font-medium text-ink-muted">
                    {pending.length === 0 ? st('orders.ordered') : st('orders.panelCount', { n: pending.length })}
                  </span>
                </Button>
              )
            })}
          </div>
        </section>
      )}

      {CATEGORY_ORDER.map((cat) => {
        const tests = caseDef.tests.filter((t) => t.category === cat)
        if (tests.length === 0) return null
        return (
          <section key={cat} className="flex flex-col gap-1.5" aria-label={st(`orders.cat.${cat}`)}>
            <h3 className="text-label font-semibold text-ink-muted uppercase">{st(`orders.cat.${cat}`)}</h3>
            <ul className="flex flex-col gap-1.5">
              {tests.map((t) => {
                const done = ordered.has(t.testId)
                return (
                  <li key={t.testId}>
                    <button
                      type="button"
                      disabled={done}
                      onClick={() => onOrder(t.testId)}
                      className={cn(
                        'flex min-h-11 w-full items-center justify-between gap-2 rounded-sm border px-3 py-2 text-left text-body-s transition-[background-color,transform] duration-100 select-none',
                        done ? 'border-transparent bg-panel text-ink-muted' : 'border-line-strong bg-surface text-ink-1 hover:bg-panel active:scale-[.985]',
                      )}
                    >
                      <span>{t.name}</span>
                      {done ? (
                        <span className="text-label font-medium">{st('orders.ordered')}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-label font-medium text-ink-muted">
                          {!instant && t.turnaroundSec > 0 && <span className="tabular-nums">{formatClock(t.turnaroundSec)}</span>}
                          <Plus className="size-4" aria-hidden="true" />
                          <span className="sr-only">{st('orders.order')}</span>
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
