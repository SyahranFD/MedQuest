import { BedDouble, Check, Clock3, Timer } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Case, Zone } from '@/features/cases/types'
import { requireCase } from '@/features/cases/repository'
import { formatClock } from '@/features/session/helpers'
import type { Session } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { patientStatus, STATUS_VARIANT } from './case-meta'
import { MOOD_STYLE } from './mood'
import { useST } from './use-st'

export const SPEEDS = [1, 2, 4] as const

/** Shift clock with speed control (ER) or the consultation countdown (poli). */
export function ClockChip({ session, patientId, onSpeed }: { session: Session; patientId: string | null; onSpeed: (speed: number) => void }) {
  const st = useST()
  if (session.mode === 'poli') {
    const p = patientId ? session.patients[patientId] : undefined
    const left = p && p.bedAtSec !== null ? session.consultLimitSec - (session.nowSec - p.bedAtSec) : session.consultLimitSec
    return (
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-2.5 text-body-s font-semibold text-ink-1" data-testid="consult-timer">
        <Timer className="size-4 text-ink-muted" aria-hidden="true" />
        <span className="tabular-nums">{left > 0 ? formatClock(left) : st('clock.over')}</span>
        <span className="sr-only">{st('clock.consultLeft')}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 pl-2.5" data-testid="shift-clock">
      <Clock3 className="size-4 text-ink-muted" aria-hidden="true" />
      <span className="mr-1 text-body-s font-semibold text-ink-1 tabular-nums" aria-label={st('clock.shift')}>
        {formatClock(session.nowSec)}
      </span>
      <div role="group" aria-label={st('clock.speed')} className="flex">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={session.speed === s}
            onClick={() => onSpeed(s)}
            className={cn(
              'grid h-8 min-w-9 place-items-center rounded-full px-2 text-label font-semibold transition-[background-color,color,transform] duration-100 active:scale-[.96] pointer-coarse:h-11 pointer-coarse:min-w-11',
              session.speed === s ? 'bg-ink-1 text-primary-ink' : 'text-ink-2 hover:bg-panel',
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}

interface BedStripProps {
  session: Session
  selectedId: string | null
  lookup?: (id: string) => Case
  onSelect: (patientId: string) => void
  /** One-line chips for the stage overlay. */
  compact?: boolean
  className?: string
}

export function BedStrip({ session, selectedId, lookup = requireCase, onSelect, compact, className }: BedStripProps) {
  const st = useST()
  const arrived = session.order.filter((id) => session.patients[id]!.status !== 'upcoming')
  const upcoming = session.order.length - arrived.length
  return (
    <ul aria-label={st('beds.title')} className={cn('flex gap-2 overflow-x-auto pb-1', className)} data-testid="bed-strip">
      {arrived.map((id) => {
        const p = session.patients[id]!
        const c = lookup(p.caseId)
        const status = patientStatus(p, c.severity)
        const unseen = p.log.orders.filter((o) => o.readyAtSec <= session.nowSec && o.seenAtSec === undefined).length
        const resolved = status === 'selesai' || status === 'meninggal'
        return (
          <li key={id} className="shrink-0">
            {compact ? (
              <button
                type="button"
                aria-pressed={selectedId === id}
                data-keep-tablet=""
                onClick={() => onSelect(id)}
                className={cn(
                  'mq-translucent flex min-h-9 items-center gap-2 rounded-full border px-3 text-label text-ink-2 transition-[border-color,transform] duration-100 active:scale-[.97] pointer-coarse:min-h-11',
                  selectedId === id ? 'border-ink-1 text-ink-1' : 'border-line hover:border-line-strong',
                  resolved && 'text-ink-muted',
                )}
              >
                <span className="font-semibold">{c.patient.name.split(' ')[0]}</span>
                <span className="text-ink-muted">
                  {p.bedIndex !== null && p.status === 'in-bed' ? st('beds.bed', { n: p.bedIndex + 1 }) : p.status === 'waiting' ? st('beds.queue') : st('beds.done')}
                </span>
                {unseen > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-ink">{unseen}</span>}
              </button>
            ) : (
              <button
                type="button"
                aria-pressed={selectedId === id}
                data-keep-tablet=""
                onClick={() => onSelect(id)}
                className={cn(
                  'flex min-h-14 w-44 flex-col gap-1.5 rounded-md border bg-surface p-2.5 text-left transition-[border-color,transform] duration-100 active:scale-[.985]',
                  selectedId === id ? 'border-ink-1' : 'border-line hover:border-line-strong',
                  resolved && 'opacity-80',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-body-s font-semibold text-ink-1">{c.patient.name.split(' ')[0]}</span>
                  <Badge variant={STATUS_VARIANT[status]}>{st(`status.${status}`)}</Badge>
                </span>
                <span className="flex items-center justify-between gap-2 text-label text-ink-muted">
                  <span className="flex items-center gap-1">
                    <BedDouble className="size-3.5" aria-hidden="true" />
                    {p.bedIndex !== null && p.status === 'in-bed' ? st('beds.bed', { n: p.bedIndex + 1 }) : p.status === 'waiting' ? st('beds.queue') : st('beds.done')}
                  </span>
                  <span className="flex items-center gap-1">
                    {unseen > 0 && <Badge variant="neutral">{st('beds.results', { n: unseen })}</Badge>}
                    {!resolved && <Badge className={MOOD_STYLE[p.emotion.mood].badge}>{st(`mood.${p.emotion.mood}`)}</Badge>}
                  </span>
                </span>
              </button>
            )}
          </li>
        )
      })}
      {upcoming > 0 && (
        <li className="shrink-0">
          <div className={cn('flex items-center justify-center text-center text-label text-ink-muted', compact ? 'mq-translucent min-h-9 rounded-full border border-dashed border-line-strong px-3' : 'min-h-14 w-32 rounded-md border border-dashed border-line-strong bg-surface px-2')}>
            {st('beds.incoming', { n: upcoming })}
          </div>
        </li>
      )}
    </ul>
  )
}

const ZONES: { zone: Zone; cls: string }[] = [
  { zone: 'red', cls: 'bg-chip-danger text-chip-danger-ink' },
  { zone: 'yellow', cls: 'bg-chip-warning text-chip-warning-ink' },
  { zone: 'green', cls: 'bg-chip-success text-chip-success-ink' },
]

interface PatientDockProps {
  session: Session
  patientId: string
  lookup?: (id: string) => Case
  onTriage: (zone: Zone) => void
}

/** ER only: triage zone for the selected patient in a bed. */
export function PatientDock({ session, patientId, lookup = requireCase, onTriage }: PatientDockProps) {
  const st = useST()
  const p = session.patients[patientId]
  if (!p) return null
  const c = lookup(p.caseId)
  const triaged = p.log.triage?.zone
  const canTriage = !triaged

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-panel p-3" data-testid="patient-dock">
      <div className="flex flex-col gap-0.5">
        <p className="text-body-s font-semibold text-ink-1">
          {c.patient.name}, {c.patient.age}
        </p>
        <p className="line-clamp-2 text-label text-ink-muted">{c.arrivalBlurb}</p>
      </div>

      {p.status === 'in-bed' && (
        <div className="flex flex-col gap-1.5">
          <p className="text-body-s font-semibold text-ink-3">{st('dock.triage')}</p>
          <div role="group" aria-label={st('dock.triage')} className="flex gap-2">
            {ZONES.map(({ zone, cls }) => (
              <button
                key={zone}
                type="button"
                disabled={!canTriage && triaged !== zone}
                aria-pressed={triaged === zone}
                onClick={() => canTriage && onTriage(zone)}
                className={cn(
                  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-sm text-body-s font-semibold transition-[opacity,transform] duration-100 active:scale-[.97] md:min-h-9',
                  cls,
                  triaged && triaged !== zone && 'opacity-35',
                )}
              >
                {triaged === zone && <Check className="size-4" aria-hidden="true" />}
                {st(`dock.zone.${zone}`)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
