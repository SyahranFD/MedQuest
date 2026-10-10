import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Case } from '@/features/cases/types'
import type { SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { seededShuffle } from './case-meta'
import { useST } from './use-st'

interface DiagnosisPanelProps {
  caseDef: Case
  patient: SessionPatient
  /** Commits the chosen diagnosis to the engine; feedback is rendered from the log afterwards. */
  onCommit: (diagnosisId: string) => void
}

export function DiagnosisPanel({ caseDef, patient, onCommit }: DiagnosisPanelProps) {
  const st = useST()
  const options = useMemo(() => seededShuffle(caseDef.diagnoses, caseDef.id), [caseDef])
  const committed = patient.log.diagnosisId
  const [picked, setPicked] = useState<string | null>(null)
  const [differential, setDifferential] = useState<string[]>([])
  const selected = committed ?? picked
  const correctId = caseDef.correctDiagnosisId
  const wasCorrect = committed === correctId

  const toggleDifferential = (id: string) =>
    setDifferential((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  const matched = differential.filter((id) => caseDef.differentialIds.includes(id)).length

  return (
    <div className="flex flex-col gap-4" data-testid="diagnosis-panel">
      <p className="rounded-sm border border-line bg-panel p-3 text-label text-ink-2">{st('dx.disclaimer')}</p>

      <section className="flex flex-col gap-2" aria-label={st('dx.main')}>
        <h3 className="text-body-s font-semibold text-ink-1">{st('dx.main')}</h3>
        <div role="radiogroup" aria-label={st('dx.main')} className="flex flex-col gap-1.5">
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
                  'flex min-h-12 w-full items-center justify-between gap-2 rounded-sm border px-3 py-2.5 text-left text-body-s transition-[background-color,border-color,transform] duration-100 select-none',
                  isSel && committed === null ? 'border-primary bg-primary-quiet text-ink-1' : 'border-line-strong bg-surface text-ink-1',
                  committed === null && 'hover:bg-panel active:scale-[.985]',
                  committed !== null && !isCorrect && !isWrong && 'border-transparent bg-panel text-ink-muted',
                )}
              >
                <span className="font-medium">{d.label}</span>
                {isCorrect && <Badge variant="success">{st('dx.correct')}</Badge>}
                {isWrong && <Badge variant="danger">{st('dx.wrong')}</Badge>}
              </button>
            )
          })}
        </div>
      </section>

      {committed === null && (
        <section className="flex flex-col gap-2" aria-label={st('dx.differential')}>
          <h3 className="text-body-s font-semibold text-ink-1">{st('dx.differential')}</h3>
          <p className="text-label text-ink-muted">{st('dx.differentialHint')}</p>
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
                    'min-h-11 rounded-full border px-3 text-label font-medium transition-[background-color,transform] duration-100 active:scale-[.985] md:min-h-9',
                    differential.includes(d.id) ? 'border-ink-1 bg-ink-1 text-primary-ink' : 'border-line-strong text-ink-2 hover:bg-panel',
                  )}
                >
                  {d.label}
                </button>
              ))}
          </div>
        </section>
      )}

      {committed === null ? (
        <Button disabled={!picked} onClick={() => picked && onCommit(picked)} size="lg" className="w-full">
          {st('dx.commit')}
        </Button>
      ) : (
        <div
          role="status"
          data-testid="dx-feedback"
          className={cn('flex flex-col gap-2 rounded-md border p-3.5', wasCorrect ? 'border-success' : 'border-danger')}
        >
          <Badge variant={wasCorrect ? 'success' : 'danger'} className="self-start">
            {wasCorrect ? st('dx.correct') : st('dx.wrong')}
          </Badge>
          <p className="text-body-s text-ink-1">
            {wasCorrect
              ? st('dx.feedbackCorrect', { dx: caseDef.diagnoses.find((d) => d.id === correctId)?.label ?? '' })
              : st('dx.feedbackWrong', { dx: caseDef.diagnoses.find((d) => d.id === correctId)?.label ?? '' })}
          </p>
          {differential.length > 0 && (
            <p className="text-label text-ink-muted">{st('dx.differentialResult', { n: matched, total: differential.length })}</p>
          )}
          <p className="text-label text-ink-muted">{st('dx.unlocked')}</p>
        </div>
      )}
    </div>
  )
}
