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
    <section aria-label={st('grading.title')} className="mx-auto flex max-w-md flex-col gap-5 rounded-lg border border-line bg-surface p-6" data-testid="grading-sequence">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('grading.title')}</h2>
        <p className="text-body-s text-ink-2">{st('grading.body')}</p>
      </div>
      <ol className="flex flex-col gap-2.5" aria-live="polite">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          return (
            <li key={s} className="flex items-center gap-3 text-body-s" aria-current={active ? 'step' : undefined}>
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong">
                {done ? (
                  <Check className="size-3.5 text-ink-1" aria-hidden="true" />
                ) : active ? (
                  <LoaderCircle className={reduced ? 'size-3.5' : 'size-3.5 animate-spin'} aria-hidden="true" />
                ) : null}
              </span>
              <span className={done ? 'text-ink-muted' : active ? 'font-medium text-ink-1' : 'text-ink-4'}>{st(`grading.step.${s}`)}</span>
            </li>
          )
        })}
      </ol>
      <div className="h-1 overflow-hidden rounded-full bg-inset" aria-hidden="true">
        <div
          className="h-full origin-left bg-primary transition-transform duration-700 ease-[var(--mq-ease-out)] motion-reduce:transition-none"
          style={{ transform: `scaleX(${Math.min(step, STEPS.length) / STEPS.length})` }}
        />
      </div>
      <Button variant="secondary" onClick={onDone} className="self-end" autoFocus>
        {st('grading.skip')}
      </Button>
    </section>
  )
}
