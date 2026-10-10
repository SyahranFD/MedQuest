import { AnimatePresence, motion } from 'motion/react'
import { BookOpen } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LogoMark } from '@/components/shell/logo'
import { useT } from '@/lib/i18n'
import { spring, useReducedMotion } from '@/lib/motion'
import { MoodFace } from './mood-face'
import type { MockupState } from './mockup-machine'
import { useLT } from './use-lt'

const SCORES = [
  ['debrief.communication', 86],
  ['debrief.history', 80],
  ['debrief.exam', 72],
  ['debrief.diagnosis', 76],
  ['debrief.management', 70],
  ['debrief.safety', 84],
] as const

function BriefState() {
  const lt = useLT()
  const t = useT()
  const vitals = [
    ['mockup.bp', '90/60'],
    ['mockup.hr', '112'],
    ['mockup.temp', '38,6'],
    ['mockup.rr', '22'],
  ] as const
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Badge variant="neutral">{lt('mockup.mode')}</Badge>
        <p className="font-display text-heading-card font-semibold text-ink-1">{lt('mockup.caseTitle')}</p>
        <p className="text-body-s text-ink-2">{lt('mockup.patient')}</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label font-semibold text-ink-muted uppercase">{lt('mockup.vitals')}</p>
        <div className="grid grid-cols-2 gap-2">
          {vitals.map(([k, v]) => (
            <div key={k} className="rounded-sm border border-line px-3 py-2">
              <p className="text-label text-ink-muted">{lt(k)}</p>
              <p className="text-lead font-semibold text-ink-1 tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </div>
      <Button size="sm" className="mt-auto self-start" tabIndex={-1}>
        {t('common.start')}
      </Button>
    </div>
  )
}

function AnamnesisState() {
  const lt = useLT()
  const t = useT()
  const reduced = useReducedMotion()
  const [answered, setAnswered] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const timer = setTimeout(() => setAnswered(true), 1000)
    return () => clearTimeout(timer)
  }, [reduced])

  const mood = answered ? 'lega' : 'cemas'
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="size-14 shrink-0">
          <MoodFace emotion={mood} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-body-s font-semibold text-ink-1">{lt('mockup.trust')}</p>
            <p className="text-body-s text-ink-2 tabular-nums">{answered ? '58%' : '45%'}</p>
          </div>
          <Progress value={answered ? 58 : 45} aria-label={lt('mockup.trust')} />
          <div className="flex items-center gap-2">
            <span className="text-body-s text-ink-2">{t(`emotion.${mood}`)}</span>
            {answered && <Badge variant="success">+13</Badge>}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3">
        <div className="ml-auto flex max-w-[85%] flex-col items-end gap-1">
          <p className="rounded-md bg-primary px-3.5 py-2.5 text-body-s text-primary-ink">{lt('mockup.question')}</p>
          <Badge variant="neutral">{lt('mockup.toneEmpathic')}</Badge>
        </div>
        <div className="min-h-[3.25rem] max-w-[85%]">
          <AnimatePresence>
            {answered && (
              <motion.p
                key="answer"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0.2 } : spring.default}
                className="rounded-md bg-panel px-3.5 py-2.5 text-body-s text-ink-1"
              >
                {lt('mockup.answer')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function LabState() {
  const lt = useLT()
  const reduced = useReducedMotion()
  const rows = [
    ['mockup.platelets', '82.000 /µL', 'danger', 'mockup.low'],
    ['mockup.wbc', '3.200 /µL', 'warning', 'mockup.low'],
    ['mockup.hb', '15,1 g/dL', 'neutral', 'mockup.normal'],
    ['mockup.hct', '46%', 'neutral', 'mockup.normal'],
  ] as const
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-heading-card font-semibold text-ink-1">{lt('mockup.labTitle')}</p>
        <motion.span
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reduced ? { duration: 0.2 } : { ...spring.default, delay: 0.25 }}
        >
          <Badge variant="neutral">{lt('mockup.labNew')}</Badge>
        </motion.span>
      </div>
      <ul className="flex flex-col">
        {rows.map(([name, value, variant, flag], i) => (
          <motion.li
            key={name}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0.2 } : { ...spring.default, delay: 0.1 + i * 0.12 }}
            className="flex items-center justify-between gap-3 border-b border-line py-3.5 last:border-b-0"
          >
            <span className="text-body-s text-ink-2">{lt(name)}</span>
            <span className="flex items-center gap-2.5">
              <span className="text-body font-semibold text-ink-1 tabular-nums">{value}</span>
              <Badge variant={variant}>{lt(flag)}</Badge>
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function DebriefState() {
  const lt = useLT()
  const t = useT()
  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-end gap-3">
        <p className="font-display text-display leading-none font-semibold text-ink-1 tabular-nums">78</p>
        <div className="pb-1.5">
          <p className="text-body-s font-semibold text-ink-1">{lt('mockup.finalScore')}</p>
          <p className="text-body-s text-ink-2">{lt('mockup.outOf')}</p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-3.5">
        {SCORES.map(([k, v]) => (
          <li key={k} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-label text-ink-2">{t(k)}</span>
              <span className="text-label font-semibold text-ink-1 tabular-nums">{v}</span>
            </div>
            <Progress value={v} className="h-1.5" aria-label={t(k)} />
          </li>
        ))}
      </ul>
      <p className="mt-auto flex items-center gap-2 text-label text-ink-muted">
        <BookOpen size={14} strokeWidth={1.75} aria-hidden="true" />
        {lt('mockup.citation')}
      </p>
    </div>
  )
}

const BODIES: Record<MockupState, () => ReactNode> = {
  brief: () => <BriefState />,
  anamnesis: () => <AnamnesisState />,
  lab: () => <LabState />,
  debrief: () => <DebriefState />,
}

/**
 * Looping product mockup built from the real design-system parts with synthetic sample data.
 * Decorative for assistive tech: one text alternative, no live region, nothing focusable.
 */
export function ProductMockup({ state }: { state: MockupState }) {
  const lt = useLT()
  const reduced = useReducedMotion()
  return (
    <div
      role="img"
      aria-label={lt('mockup.alt')}
      aria-live="off"
      className="relative overflow-hidden rounded-lg border border-line bg-surface"
    >
      <div aria-hidden="true" inert className="flex h-[26rem] flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-panel px-4">
          <LogoMark className="size-5" />
          <span className="text-label font-semibold text-ink-1">MedQuest</span>
          <Badge variant="neutral" className="ml-auto">
            {lt('mockup.synthetic')}
          </Badge>
        </div>
        <div className="relative min-h-0 flex-1 p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state}
              className="h-full"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={reduced ? { duration: 0.2 } : { ...spring.default, opacity: { duration: 0.22 } }}
            >
              {BODIES[state]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
