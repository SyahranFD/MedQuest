import { motion } from 'motion/react'
import { useRef } from 'react'
import { Reveal } from '@/components/ui/reveal'
import { useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { MOCKUP_DWELL_MS, MOCKUP_STATES, type MockupState } from './mockup-machine'
import { ProductMockup } from './product-mockup'
import { Section } from './section'
import { useLT } from './use-lt'
import { useMockupLoop } from './use-mockup-loop'

const STEP_KEYS: Record<MockupState, string> = {
  brief: 'how.s1',
  anamnesis: 'how.s2',
  lab: 'how.s3',
  debrief: 'how.s4',
}

export function HowItWorks() {
  const lt = useLT()
  const reduced = useReducedMotion()
  const regionRef = useRef<HTMLDivElement>(null)
  const { state, select, playing, hold } = useMockupLoop(regionRef)

  return (
    <Section id="cara-kerja" labelledBy="how-title">
      <Reveal>
        <h2 id="how-title" className="max-w-[22ch] font-display text-heading-page font-semibold text-ink-1">
          {lt('how.title')}
        </h2>
      </Reveal>
      <div
        ref={regionRef}
        onPointerEnter={() => hold(true)}
        onPointerLeave={() => hold(false)}
        onFocus={() => hold(true)}
        onBlur={() => hold(false)}
        className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16"
      >
        <ol aria-label={lt('how.steps')} className="flex flex-col gap-1 lg:gap-2">
          {MOCKUP_STATES.map((s) => {
            const active = s === state
            const key = STEP_KEYS[s]
            return (
              <li key={s}>
                <button
                  type="button"
                  aria-current={active ? 'step' : undefined}
                  onClick={() => select(s)}
                  className={cn(
                    'relative flex min-h-11 w-full flex-col gap-1.5 rounded-md px-4 pt-4 pb-5 text-left transition-colors duration-100',
                    active ? 'bg-panel' : 'hover:bg-panel/60',
                  )}
                >
                  <span className="font-display text-heading-card font-semibold text-ink-1">{lt(`${key}.title`)}</span>
                  <span className={cn('max-w-[44ch] text-body-s text-ink-2 lg:block', !active && 'hidden')}>{lt(`${key}.body`)}</span>
                  <span aria-hidden="true" className="absolute inset-x-4 bottom-2 h-0.5 overflow-hidden rounded-full bg-line">
                    {active && (
                      <motion.span
                        key={`${s}-${playing}`}
                        className="block size-full origin-left bg-primary"
                        initial={{ scaleX: reduced || !playing ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: reduced || !playing ? 0 : MOCKUP_DWELL_MS / 1000, ease: 'linear' }}
                      />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="order-first flex flex-col gap-3 lg:sticky lg:top-28 lg:order-last">
          <ProductMockup state={state} />
          <p className="text-label text-ink-muted">{lt('how.sample')}</p>
        </div>
      </div>
    </Section>
  )
}
