import { BedDouble } from 'lucide-react'
import { requireCase } from '@/features/cases/repository'
import type { Session } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { useST } from './use-st'

interface BedPlacementProps {
  session: Session
  patientId: string
  onAssign: (bedIndex: number) => void
}

/** ER only: the whole tablet while the selected patient has no bed. Choosing a bed hands over to the examination tabs. */
export function BedPlacement({ session, patientId, onAssign }: BedPlacementProps) {
  const st = useST()
  const patient = session.patients[patientId]
  if (!patient) return null
  const c = requireCase(patient.caseId)
  const full = session.beds.every((b) => b !== null)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-5 sm:p-8" data-testid="bed-placement">
      <div className="flex flex-col gap-1 rounded-md border border-line bg-panel p-4">
        <p className="text-body font-semibold text-ink-1">
          {c.patient.name}, {c.patient.age}
        </p>
        <p className="text-body-s text-ink-2">{c.arrivalBlurb}</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-body font-semibold text-ink-1">{st('place.head')}</h2>
          <p className="text-body-s text-ink-muted">{st('place.hint', { name: c.patient.name.split(' ')[0]! })}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {session.beds.map((occupant, i) => {
            const taken = occupant !== null
            return (
              <button
                key={i}
                type="button"
                disabled={taken}
                onClick={() => onAssign(i)}
                className={cn(
                  'flex min-h-28 flex-col items-center justify-center gap-2 rounded-md border px-2 text-center transition-[border-color,background-color,transform] duration-100 ease-out outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  taken
                    ? 'border-line bg-panel text-ink-4'
                    : 'border-line-strong bg-surface text-ink-1 hover:border-ink-1 active:scale-[.97]',
                )}
              >
                <BedDouble className="size-7" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-body font-semibold">{st('beds.bed', { n: i + 1 })}</span>
                <span className="text-label text-ink-muted">
                  {taken ? `${st('place.taken')}: ${requireCase(session.patients[occupant]!.caseId).patient.name.split(' ')[0]}` : st('place.free')}
                </span>
              </button>
            )
          })}
        </div>
        {full && <p className="text-label text-ink-muted">{st('dock.noBed')}</p>}
      </div>
    </div>
  )
}
