import { Check, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useReducedMotion } from '@/lib/motion'
import { useST } from './use-st'

const STEPS = ['replay', 'history', 'exam', 'reasoning', 'management', 'safety'] as const
const STEP_MS = 750
const SETTLE_MS = 450

/** Staged "grading" theatre, about five seconds. Skippable at any moment, never blocks the result. */
export function GradingSequence({ onDone }: { onDone: () => void }) {
  const st = useST()
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => (step >= STEPS.length ? onDone() : setStep(step + 1)), step >= STEPS.length ? SETTLE_MS : STEP_MS)
    return () => clearTimeout(id)
  }, [step, onDone])

  return (
    <section aria-label={st('grading.title')} className="flex flex-col gap-6 border-t border-line pt-8" data-testid="grading-sequence">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-section font-semibold text-ink-1">{st('grading.title')}</h2>
        <p className="text-body-s text-ink-3">{st('grading.body')}</p>
      </div>
      <ol className="flex flex-col gap-3" aria-live="polite">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={s} className="flex items-center gap-3 text-body-s" aria-current={active ? 'step' : undefined}>
              <span className="grid size-5 shrink-0 place-items-center">
                {done ? (
                  <Check className="size-4 text-success" strokeWidth={1.75} aria-hidden="true" />
                ) : active ? (
                  <LoaderCircle className={reduced ? 'size-4' : 'size-4 animate-spin'} strokeWidth={1.5} aria-hidden="true" />
                ) : null}
              </span>
              <span className={`transition-colors duration-200 motion-reduce:transition-none ${active ? 'font-medium text-ink-1' : 'text-ink-3'}`}>{st(`grading.step.${s}`)}</span>
            </li>
          )
        })}
      </ol>
      <div className="h-0.5 overflow-hidden rounded-full bg-inset" aria-hidden="true">
        <div
          className="h-full origin-left bg-ink-1 transition-transform duration-700 ease-[var(--mq-ease-out)] motion-reduce:transition-none"
          style={{ transform: `scaleX(${Math.min(step, STEPS.length) / STEPS.length})` }}
        />
      </div>
      <Button variant="secondary" onClick={onDone} className="self-start" autoFocus>
        {st('grading.skip')}
      </Button>
    </section>
  )
}
