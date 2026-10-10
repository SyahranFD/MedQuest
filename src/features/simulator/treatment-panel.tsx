import { Check, Lock } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Case, TreatmentDef } from '@/features/cases/types'
import type { Session, SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { useST } from './use-st'

interface TreatmentPanelProps {
  caseDef: Case
  mode: Session['mode']
  patient: SessionPatient
  onTreat: (treatmentId: string, opts: { dose?: string; duration?: string }) => void
  onDispose: (dispositionId: string) => void
}

/** Poli prescriptions wait for a committed diagnosis; ER treatment is time-critical and never locks. */
export function isTreatmentLocked(mode: Session['mode'], patient: Pick<SessionPatient, 'log'>) {
  return mode === 'poli' && patient.log.diagnosisId === null
}

export function TreatmentPanel({ caseDef, mode, patient, onTreat, onDispose }: TreatmentPanelProps) {
  const st = useST()
  const [open, setOpen] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ dose: string; duration: string }>({ dose: '', duration: '' })
  const [dispo, setDispo] = useState<string | null>(null)
  const locked = isTreatmentLocked(mode, patient)
  const given = new Map(patient.log.treatments.map((t) => [t.id, t]))
  const disposed = patient.log.dispositionId
  const groups: { key: TreatmentDef['category']; items: TreatmentDef[] }[] = [
    { key: 'tindakan', items: caseDef.treatments.filter((t) => t.category === 'tindakan') },
    { key: 'obat', items: caseDef.treatments.filter((t) => t.category === 'obat') },
  ]

  const select = (t: TreatmentDef) => {
    if (open === t.id) return setOpen(null)
    setOpen(t.id)
    setDraft({ dose: t.defaultDose ?? '', duration: t.defaultDuration ?? '' })
  }

  const confirm = (t: TreatmentDef) => {
    onTreat(t.id, t.category === 'obat' ? { dose: draft.dose.trim() || undefined, duration: draft.duration.trim() || undefined } : {})
    setOpen(null)
  }

  return (
    <div className="flex flex-col gap-5" data-testid="treatment-panel">
      <p className="rounded-sm border border-line bg-panel p-3 text-label text-ink-2">{st('rx.disclaimer')}</p>

      {locked ? (
        <div role="status" className="flex items-start gap-2.5 rounded-md border border-line-strong p-3.5 text-body-s text-ink-2" data-testid="rx-locked">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {st('rx.locked')}
        </div>
      ) : (
        groups.map(
          (g) =>
            g.items.length > 0 && (
              <section key={g.key} className="flex flex-col gap-1.5" aria-label={st(`rx.cat.${mode}.${g.key}`)}>
                <h3 className="text-label font-semibold text-ink-muted uppercase">{st(`rx.cat.${mode}.${g.key}`)}</h3>
                <ul className="flex flex-col gap-1.5">
                  {g.items.map((t) => {
                    const entry = given.get(t.id)
                    const isOpen = open === t.id
                    return (
                      <li key={t.id} className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={!!entry || disposed !== null}
                          aria-expanded={isOpen}
                          onClick={() => select(t)}
                          className={cn(
                            'flex min-h-11 w-full items-center justify-between gap-2 rounded-sm border px-3 py-2 text-left text-body-s transition-[background-color,transform] duration-100 select-none',
                            entry ? 'border-transparent bg-panel text-ink-muted' : 'border-line-strong bg-surface text-ink-1 hover:bg-panel active:scale-[.985]',
                            isOpen && 'border-primary',
                          )}
                        >
                          <span className="flex flex-col">
                            <span className="font-medium">{t.name}</span>
                            {entry && (entry.dose || entry.duration) && (
                              <span className="text-label">{[entry.dose, entry.duration].filter(Boolean).join(' / ')}</span>
                            )}
                          </span>
                          {entry && (
                            <>
                              <Check className="size-4 shrink-0" aria-hidden="true" />
                              <span className="sr-only">{st('rx.given')}</span>
                            </>
                          )}
                        </button>
                        {isOpen && (
                          <div className="flex flex-col gap-2.5 rounded-sm border border-line bg-surface p-3">
                            {t.category === 'obat' && (
                              <>
                                <div className="flex flex-col gap-1.5">
                                  <Label htmlFor={`dose-${t.id}`}>{st('rx.dose')}</Label>
                                  <Input id={`dose-${t.id}`} value={draft.dose} onChange={(e) => setDraft((d) => ({ ...d, dose: e.target.value }))} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <Label htmlFor={`dur-${t.id}`}>{st('rx.duration')}</Label>
                                  <Input id={`dur-${t.id}`} value={draft.duration} onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))} />
                                </div>
                              </>
                            )}
                            <Button onClick={() => confirm(t)}>{st(mode === 'er' ? 'rx.giveEr' : 'rx.givePoli')}</Button>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ),
        )
      )}

      {!locked && (
        <section className="flex flex-col gap-2" aria-label={st('rx.disposition')}>
          <h3 className="text-body-s font-semibold text-ink-1">{st('rx.disposition')}</h3>
          {disposed ? (
            <p role="status" className="rounded-md border border-line p-3 text-body-s text-ink-1" data-testid="dispo-done">
              {st('rx.dispositionDone', { name: caseDef.dispositions.find((d) => d.id === disposed)?.name ?? disposed })}
            </p>
          ) : (
            <>
              <div role="radiogroup" aria-label={st('rx.disposition')} className="flex flex-col gap-1.5">
                {caseDef.dispositions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={dispo === d.id}
                    onClick={() => setDispo(d.id)}
                    className={cn(
                      'flex min-h-11 w-full items-center rounded-sm border px-3 py-2 text-left text-body-s transition-[background-color,transform] duration-100 select-none active:scale-[.985]',
                      dispo === d.id ? 'border-primary bg-primary-quiet' : 'border-line-strong bg-surface hover:bg-panel',
                    )}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
              <Button disabled={!dispo} onClick={() => dispo && onDispose(dispo)} className="w-full" size="lg">
                {st('rx.commitDisposition')}
              </Button>
            </>
          )}
        </section>
      )}
    </div>
  )
}
