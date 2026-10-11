import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { MeterBars } from '@/components/charts/meter-bars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DIMENSIONS } from '@/features/cases/types'
import type { Band } from '@/features/cases/types'
import type { HistoryRow } from './stats'
import { useHt } from './use-ht'

export const BAND_VARIANT: Record<Band, 'success' | 'info' | 'warning' | 'danger'> = {
  excellent: 'success',
  good: 'success',
  pass: 'info',
  borderline: 'warning',
  'clear-fail': 'danger',
}

export function RatingBadge({ band }: { band: Band }) {
  const { ht } = useHt()
  return <Badge variant={BAND_VARIANT[band]}>{ht(`band.${band}`)}</Badge>
}

/** Detail drawer for one graded case, with a link to the full debrief. */
export function HistoryDetail({ row, onClose }: { row: HistoryRow | null; onClose: () => void }) {
  const { ht, dimension, dateTime } = useHt()
  const e = row?.evaluation
  return (
    <Dialog open={row !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[var(--mq-page-read)] gap-5 overflow-y-auto p-6">
        {row && e && (
          <>
            <DialogHeader>
              <DialogTitle>{e.caseTitle}</DialogTitle>
              <DialogDescription>
                {ht(`mode.${row.mode}`)} · {dateTime(row.savedAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-display text-title font-semibold text-ink-1 tabular-nums">{e.percent}%</span>
                <RatingBadge band={e.band} />
                <span className="text-meta text-ink-3 tabular-nums">{ht('detail.empathy', { n: e.empathyScore })}</span>
              </div>
              <p className="max-w-prose text-body-s text-ink-2">{e.headline}</p>
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <h3 className="text-body-s font-medium text-ink-1">{ht('detail.dims')}</h3>
              <MeterBars
                rows={DIMENSIONS.map((d) => ({ key: d, label: dimension(d), value: e.dimensions[d].percent }))}
                describe={(r) => ht('dims.aria', { dim: r.label, value: Math.round(r.value) })}
              />
            </div>
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <h3 className="text-body-s font-medium text-ink-1">{ht('detail.improve')}</h3>
              {e.improvements.length > 0 ? (
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
                  {e.improvements.slice(0, 3).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-s text-ink-3">{ht('detail.none')}</p>
              )}
            </div>
            <Button asChild className="w-fit">
              <Link to={'/app/debrief/$sessionId' as '/'} params={{ sessionId: row.recordId } as never}>
                {ht('detail.open')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
