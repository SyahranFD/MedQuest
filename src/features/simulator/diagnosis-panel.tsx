import { Check, ClipboardCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Case } from '@/features/cases/types'
import type { SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { seededShuffle } from './case-meta'
import { TabHeader } from './tab-header'
import { useST } from './use-st'

interface DiagnosisPanelProps {
  caseDef: Case
  patient: SessionPatient
  /** Commits the chosen diagnosis to the engine; feedback is rendered from the log afterwards. */
  onCommit: (diagnosisId: string) => void
}

function StepTitle({ n, children }: { n: number; children: string }) {
  return (
    <h3 className="flex items-center gap-2.5 text-body-s font-semibold text-ink-1">
      <span className="grid size-6 place-items-center rounded-full border border-line-strong text-label font-semibold text-ink-2 tabular-nums" aria-hidden="true">
        {n}
      </span>
      {children}
    </h3>
  )
}

/** "Decision sheet": one centred column, two numbered steps and a sticky action bar. */
export function DiagnosisPanel({ caseDef, patient, onCommit }: DiagnosisPanelProps) {
  const st = useST()
  const options = useMemo(() => seededShuffle(caseDef.diagnoses, caseDef.id), [caseDef])
  const committed = patient.log.diagnosisId
  const [picked, setPicked] = useState<string | null>(null)
  const [differential, setDifferential] = useState<string[]>([])
  const selected = committed ?? picked
  const correctId = caseDef.correctDiagnosisId
  const wasCorrect = committed === correctId
  const label = (id: string | null) => caseDef.diagnoses.find((d) => d.id === id)?.label ?? ''

  const toggleDifferential = (id: string) =>
    setDifferential((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  const chosenDifferential = differential.filter((id) => id !== picked)
  const matched = differential.filter((id) => caseDef.differentialIds.includes(id)).length

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6" data-testid="diagnosis-panel">
      <TabHeader icon={ClipboardCheck} tint="green" align="center" title={st('tab.dx')} hint={st('dx.hint')} />

      <section className="flex flex-col gap-3" aria-label={st('dx.main')}>
        <StepTitle n={1}>{st('dx.main')}</StepTitle>
        <div role="radiogroup" aria-label={st('dx.main')} className="flex flex-col gap-2">
          {options.map((d) => {
            const isSel = selected === d.id
            const isCorrect = committed !== null && d.id === correctId
            const isWrong = committed !== null && d.id === committed && d.id !== correctId
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={isSel}
                disabled={committed !== null}
                onClick={() => setPicked(d.id)}
                className={cn(
                  'flex min-h-14 w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-body-s transition-[background-color,border-color,transform] duration-100 select-none',
                  isSel ? 'border-primary bg-primary-quiet' : 'border-line bg-surface',
                  committed === null && !isSel && 'hover:bg-panel',
                  committed === null && 'active:scale-[.985]',
                  committed !== null && !isSel && !isCorrect && 'bg-panel text-ink-muted',
                )}
              >
                <span
                  className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2', isSel ? 'border-primary bg-primary text-primary-ink' : 'border-line-strong')}
                  aria-hidden="true"
                >
                  {isSel && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="flex-1 font-medium text-ink-1">{d.label}</span>
                {isCorrect && <Badge variant="success">{st('dx.correct')}</Badge>}
                {isWrong && <Badge variant="danger">{st('dx.wrong')}</Badge>}
              </button>
            )
          })}
        </div>
      </section>

      {committed === null && (
        <section className="flex flex-col gap-3" aria-label={st('dx.differential')}>
          <div className="flex items-center justify-between gap-2">
            <StepTitle n={2}>{st('dx.differential')}</StepTitle>
            <span className="text-label text-ink-muted tabular-nums" data-testid="dx-differential-count">
              {st('dx.differentialCount', { n: chosenDifferential.length })}
            </span>
          </div>
          <p className="-mt-1.5 text-label text-ink-muted">{st('dx.differentialHint')}</p>
          <div className="flex flex-wrap gap-2">
            {options
              .filter((d) => d.id !== picked)
              .map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={differential.includes(d.id)}
                  onClick={() => toggleDifferential(d.id)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-meta font-medium transition-[background-color,transform] duration-100 active:scale-[.985] md:min-h-9',
                    differential.includes(d.id) ? 'border-primary bg-primary text-primary-ink' : 'border-line-strong text-ink-2 hover:bg-panel',
                  )}
                >
                  {differential.includes(d.id) && <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />}
                  {d.label}
                </button>
              ))}
          </div>
        </section>
      )}

      {committed === null ? (
        <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-ground px-5 py-3" data-testid="dx-action-bar">
          <p className="min-w-0 flex-1 text-meta text-ink-3" data-testid="dx-summary">
            {picked ? (
              <>
                <span className="font-medium text-ink-1">{label(picked)}</span>
                {chosenDifferential.length > 0 && ` + ${st('dx.differentialCount', { n: chosenDifferential.length })}`}
              </>
            ) : (
              st('dx.summaryEmpty')
            )}
          </p>
          <Button disabled={!picked} onClick={() => picked && onCommit(picked)} size="lg">
            {st('dx.commit')}
          </Button>
        </div>
      ) : (
        <div
          role="status"
          data-testid="dx-feedback"
          className={cn('flex flex-col gap-2 rounded-md border p-3.5', wasCorrect ? 'border-success' : 'border-danger')}
        >
          <Badge variant={wasCorrect ? 'success' : 'danger'} className="self-start">
            {wasCorrect ? st('dx.correct') : st('dx.wrong')}
          </Badge>
          <p className="text-body-s text-ink-1">{st(wasCorrect ? 'dx.feedbackCorrect' : 'dx.feedbackWrong', { dx: label(correctId) })}</p>
          {differential.length > 0 && (
            <p className="text-label text-ink-muted">{st('dx.differentialResult', { n: matched, total: differential.length })}</p>
          )}
          <p className="text-label text-ink-muted">{st('dx.unlocked')}</p>
        </div>
      )}
    </div>
  )
}
