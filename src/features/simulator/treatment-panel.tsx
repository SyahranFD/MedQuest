import { Check, Lock, PenLine, Pill, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Case, TreatmentDef } from '@/features/cases/types'
import type { Session, SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { TabHeader } from './tab-header'
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

type Draft = Record<string, { dose: string; duration: string }>

/** "Prescription pad": drug and procedure choices on the left, the paper pad being written on the right. */
export function TreatmentPanel({ caseDef, mode, patient, onTreat, onDispose }: TreatmentPanelProps) {
  const st = useST()
  const [draft, setDraft] = useState<Draft>({})
  const [dispo, setDispo] = useState<string | null>(null)
  const pad = useRef<HTMLElement>(null)
  const locked = isTreatmentLocked(mode, patient)
  const given = new Map(patient.log.treatments.map((t) => [t.id, t]))
  const disposed = patient.log.dispositionId
  const groups: { key: TreatmentDef['category']; items: TreatmentDef[] }[] = [
    { key: 'tindakan', items: caseDef.treatments.filter((t) => t.category === 'tindakan') },
    { key: 'obat', items: caseDef.treatments.filter((t) => t.category === 'obat') },
  ]
  const chosen = caseDef.treatments.filter((t) => draft[t.id])

  const add = (t: TreatmentDef) => {
    setDraft((d) => ({ ...d, [t.id]: { dose: t.defaultDose ?? '', duration: t.defaultDuration ?? '' } }))
    // Stacked layout (phone): the pad sits below the list, so bring it into view when it is off screen.
    const el = pad.current
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.7) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  const remove = (id: string) =>
    setDraft((d) => {
      const { [id]: _removed, ...rest } = d
      return rest
    })
  const edit = (id: string, field: 'dose' | 'duration', value: string) =>
    setDraft((d) => ({ ...d, [id]: { ...d[id]!, [field]: value } }))

  const sign = () => {
    for (const t of chosen) {
      const f = draft[t.id]!
      onTreat(t.id, t.category === 'obat' ? { dose: f.dose.trim() || undefined, duration: f.duration.trim() || undefined } : {})
    }
    setDraft({})
  }

  return (
    <div className="flex flex-col gap-4" data-testid="treatment-panel">
      <TabHeader icon={Pill} tint="amber" title={st('tab.rx')} hint={st(mode === 'er' ? 'rx.hintEr' : 'rx.hintPoli')} />

      {locked ? (
        <div role="status" className="flex items-start gap-2.5 rounded-md border border-dashed border-line-strong p-4 text-body-s text-ink-2" data-testid="rx-locked">
          <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {st('rx.locked')}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex flex-col gap-4">
            {groups.map(
              (g) =>
                g.items.length > 0 && (
                  <section key={g.key} className="flex flex-col gap-1.5" aria-label={st(`rx.cat.${mode}.${g.key}`)}>
                    <h3 className="text-label font-semibold text-ink-muted uppercase">{st(`rx.cat.${mode}.${g.key}`)}</h3>
                    <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface">
                      {g.items.map((t) => {
                        const entry = given.get(t.id)
                        const inPad = !!draft[t.id]
                        const unavailable = !!entry || inPad || disposed !== null
                        return (
                          <li key={t.id} className="flex min-h-12 items-center gap-3 px-3 py-2">
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className="text-meta font-medium text-ink-1">{t.name}</span>
                              {t.form && <span className="text-label text-ink-muted">{t.form}</span>}
                            </span>
                            {entry ? (
                              <>
                                <Check className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                                <span className="sr-only">{st('rx.given')}</span>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={unavailable}
                                onClick={() => add(t)}
                                aria-label={`${st('rx.add')}: ${t.name}`}
                                className={cn(
                                  'grid size-11 shrink-0 place-items-center rounded-row border transition-[background-color,transform] duration-100 select-none md:size-9',
                                  inPad ? 'border-transparent bg-panel text-ink-muted' : 'border-line-strong text-ink-1 hover:bg-panel active:scale-95',
                                )}
                              >
                                {inPad ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ),
            )}
          </div>

          <section ref={pad} aria-label={st('rx.pad')} className="flex flex-col gap-4 rounded-md border border-line-strong bg-paper p-4 text-ink-1" data-testid="rx-pad">
            <div className="flex items-baseline justify-between border-b border-dashed border-line-strong pb-2">
              <h3 className="font-display text-heading-card font-semibold">
                <span aria-hidden="true">Rp/ </span>
                {st('rx.pad')}
              </h3>
              <span className="text-label text-ink-3">{caseDef.patient.name}</span>
            </div>

            {chosen.length === 0 && patient.log.treatments.length === 0 ? (
              <p className="py-4 text-meta text-ink-3" data-testid="rx-pad-empty">{st('rx.padEmpty')}</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {patient.log.treatments.map((e) => (
                  <li key={e.id} className="flex items-start gap-2 text-meta text-ink-3" data-testid="rx-signed">
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span className="flex flex-col">
                      <span className="font-medium text-ink-2">{caseDef.treatments.find((t) => t.id === e.id)?.name ?? e.id}</span>
                      {(e.dose || e.duration) && <span className="text-label">{[e.dose, e.duration].filter(Boolean).join(' / ')}</span>}
                    </span>
                  </li>
                ))}
                {chosen.map((t, i) => (
                  <li key={t.id} className="flex flex-col gap-2" data-testid="rx-line">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-meta font-semibold">
                        {i + 1}. {t.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        aria-label={`${st('rx.remove')}: ${t.name}`}
                        className="grid size-11 place-items-center rounded-row text-ink-3 transition-[background-color,color] duration-100 hover:bg-hover hover:text-ink-1 md:size-8"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    {t.category === 'obat' && (
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1 text-label text-ink-3" htmlFor={`dose-${t.id}`}>
                          {st('rx.dose')}
                          <Input id={`dose-${t.id}`} value={draft[t.id]!.dose} onChange={(e) => edit(t.id, 'dose', e.target.value)} />
                        </label>
                        <label className="flex flex-col gap-1 text-label text-ink-3" htmlFor={`dur-${t.id}`}>
                          {st('rx.duration')}
                          <Input id={`dur-${t.id}`} value={draft[t.id]!.duration} onChange={(e) => edit(t.id, 'duration', e.target.value)} />
                        </label>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}

            <Button onClick={sign} disabled={chosen.length === 0} size="lg" className="self-end" data-testid="rx-sign">
              <PenLine aria-hidden="true" />
              {st(mode === 'er' ? 'rx.signEr' : 'rx.signPoli', { n: chosen.length })}
            </Button>

            <section className="flex flex-col gap-2 border-t border-dashed border-line-strong pt-3" aria-label={st('rx.disposition')}>
              <h4 className="text-label font-semibold text-ink-muted uppercase">{st('rx.disposition')}</h4>
              {disposed ? (
                <p role="status" className="text-meta font-medium" data-testid="dispo-done">
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
                          'flex min-h-11 w-full items-center gap-2.5 rounded-sm border px-3 py-2 text-left text-meta transition-[background-color,transform] duration-100 select-none active:scale-[.985] md:min-h-9',
                          dispo === d.id ? 'border-primary bg-primary-quiet' : 'border-line-strong bg-surface hover:bg-panel',
                        )}
                      >
                        <span
                          className={cn('grid size-4 shrink-0 place-items-center rounded-full border-2', dispo === d.id ? 'border-primary bg-primary text-primary-ink' : 'border-line-strong')}
                          aria-hidden="true"
                        >
                          {dispo === d.id && <Check className="size-2.5" strokeWidth={3.5} />}
                        </span>
                        {d.name}
                      </button>
                    ))}
                  </div>
                  <Button disabled={!dispo} onClick={() => dispo && onDispose(dispo)} variant="secondary" className="self-end">
                    {st('rx.commitDisposition')}
                  </Button>
                </>
              )}
            </section>
            <p className="text-label text-ink-3">{st('rx.disclaimer')}</p>
          </section>
        </div>
      )}
    </div>
  )
}
