import { Check, FlaskConical, LoaderCircle, PackagePlus, Plus, Search } from 'lucide-react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { Case, TestCategory } from '@/features/cases/types'
import { requireCase } from '@/features/cases/repository'
import { listResults } from '@/features/session/er-engine'
import { formatClock } from '@/features/session/helpers'
import type { Session, SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { ImagingViewer } from './imaging'
import { TabHeader } from './tab-header'
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

/** "Order desk": a searchable catalogue on the left, the pending queue and a results table on the right. */
export function OrdersPanel({ caseDef, session, patient, onOrder, onOrderPanel, onMarkSeen }: OrdersPanelProps) {
  const st = useST()
  const results = useMemo(() => listResults(session, patient.id, requireCase), [session, patient.id])
  const ordered = new Set(patient.log.orders.map((o) => o.testId))
  const instant = session.mode === 'poli'
  const unseen = results.filter((r) => r.ready && !r.seen).length
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const pending = results.filter((r) => !r.ready)
  const ready = results.filter((r) => r.ready)

  useEffect(() => {
    if (unseen > 0) onMarkSeen()
  }, [unseen, onMarkSeen])

  return (
    <div className="flex flex-col gap-4" data-testid="orders-panel">
      <TabHeader
        icon={FlaskConical}
        tint="blue"
        title={st('tab.orders')}
        hint={st(instant ? 'orders.hintInstant' : 'orders.hint')}
        trailing={
          <span className="text-meta font-medium text-ink-3 tabular-nums" data-testid="order-count">
            {st('orders.count', { n: ordered.size })}
          </span>
        }
      />

      <div className="grid gap-3 md:h-[min(30rem,calc(80vh-11rem))] md:grid-cols-2">
        <section aria-label={st('orders.catalogue')} className="flex min-h-0 flex-col rounded-md border border-line bg-surface">
          <div className="relative border-b border-line p-2">
            <Search className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={st('orders.search')}
              aria-label={st('orders.search')}
              className="pl-8"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-2 max-md:max-h-96">
            {caseDef.panels.length > 0 && needle === '' && (
              <ul className="flex flex-col gap-2" aria-label={st('orders.panels')}>
                {caseDef.panels.map((p) => {
                  const rest = p.testIds.filter((id) => !ordered.has(id))
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={rest.length === 0}
                        onClick={() => onOrderPanel(rest)}
                        className={cn(
                          'flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-[background-color,transform] duration-100 select-none',
                          rest.length === 0 ? 'border-line bg-panel text-ink-muted' : 'border-primary bg-primary-quiet text-ink-1 hover:bg-tint-green active:scale-[.985]',
                        )}
                      >
                        <PackagePlus className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="text-meta font-semibold">{p.label}</span>
                          <span className="text-label text-ink-3">{st('orders.panelCount', { n: p.testIds.length })}</span>
                        </span>
                        <span className="text-label font-medium">{rest.length === 0 ? st('orders.ordered') : st('orders.panelAdd', { n: rest.length })}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {CATEGORY_ORDER.map((cat) => {
              const tests = caseDef.tests.filter((t) => t.category === cat && t.name.toLowerCase().includes(needle))
              if (tests.length === 0) return null
              return (
                <section key={cat} aria-label={st(`orders.cat.${cat}`)} className="flex flex-col">
                  <h3 className="px-1 pb-1 text-label font-semibold text-ink-muted uppercase">{st(`orders.cat.${cat}`)}</h3>
                  <ul className="flex flex-col divide-y divide-line rounded-sm border border-line">
                    {tests.map((t) => {
                      const done = ordered.has(t.testId)
                      return (
                        <li key={t.testId}>
                          <button
                            type="button"
                            disabled={done}
                            aria-pressed={done}
                            onClick={() => onOrder(t.testId)}
                            className={cn(
                              'flex min-h-11 w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] transition-[background-color] duration-100 select-none md:min-h-9',
                              done ? 'bg-panel text-ink-muted' : 'text-ink-1 hover:bg-panel active:bg-inset',
                            )}
                          >
                            <span className="flex-1">{t.name}</span>
                            {!done && !instant && t.turnaroundSec > 0 && <span className="text-label text-ink-muted tabular-nums">{formatClock(t.turnaroundSec)}</span>}
                            <span className={cn('grid size-5 shrink-0 place-items-center rounded-xs border', done ? 'border-primary bg-primary text-primary-ink' : 'border-line-strong text-ink-3')}>
                              {done ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
                            </span>
                            <span className="sr-only">{done ? st('orders.ordered') : st('orders.order')}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
          </div>
          <p className="border-t border-line px-3 py-2 text-label text-ink-3 tabular-nums">{st('orders.footer', { n: ordered.size })}</p>
        </section>

        <section aria-label={st('orders.queue')} className="flex min-h-0 flex-col rounded-md border border-line bg-surface">
          <h3 className="border-b border-line px-3 py-2.5 text-meta font-semibold text-ink-1">{st('orders.queue')}</h3>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {results.length === 0 ? (
              <p className="m-3 rounded-sm border border-dashed border-line-strong p-3 text-meta text-ink-muted">{st(instant ? 'orders.emptyInstant' : 'orders.empty')}</p>
            ) : (
              <>
                {pending.length > 0 && (
                  <ul className="flex flex-col divide-y divide-line border-b border-line" aria-label={st('orders.pending')}>
                    {pending.map((r) => (
                      <li key={r.testId} className="flex min-h-10 items-center gap-2 px-3 py-1.5 text-[13px]" data-testid="pending-row">
                        <LoaderCircle className="size-4 shrink-0 animate-spin text-ink-3 motion-reduce:animate-none" aria-hidden="true" />
                        <span className="flex-1 text-ink-1">{r.name}</span>
                        <span className="text-label font-medium text-ink-3 tabular-nums">{st('orders.eta', { time: formatClock(Math.max(0, r.readyAtSec - session.nowSec)) })}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {ready.length > 0 && (
                  <table className="w-full text-left text-[13px]" aria-label={st('orders.results')}>
                    <thead>
                      <tr className="border-b border-line text-label text-ink-muted">
                        <th scope="col" className="px-3 py-1.5 font-medium">{st('orders.colTest')}</th>
                        <th scope="col" className="px-2 py-1.5 font-medium">{st('orders.colResult')}</th>
                        <th scope="col" className="w-20 px-3 py-1.5 text-right font-medium">{st('orders.colFlag')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {ready.map((r) => (
                        <Fragment key={r.testId}>
                          <tr className="align-top" data-testid="result-card">
                            <th scope="row" className="px-3 py-2 font-medium text-ink-1">{r.name}</th>
                            <td className={cn('px-2 py-2', r.abnormal ? 'font-medium text-ink-1' : 'text-ink-2')}>{r.text}</td>
                            <td className="px-3 py-2 text-right">
                              {r.critical ? (
                                <Badge variant="danger">{st('orders.critical')}</Badge>
                              ) : r.abnormal ? (
                                <Badge variant="warning">{st('orders.abnormal')}</Badge>
                              ) : (
                                <>
                                  <Check className="ml-auto size-4 text-ink-4" strokeWidth={2} aria-hidden="true" />
                                  <span className="sr-only">{st('orders.normal')}</span>
                                </>
                              )}
                            </td>
                          </tr>
                          {r.imageId && (
                            <tr>
                              <td colSpan={3} className="px-3 pb-3">
                                <ImagingViewer imageId={r.imageId} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
