import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Emotion } from '@/lib/emotion'
import { spring, useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { formatDelta, MOOD_STYLE } from './mood'
import type { TurnFeedback } from './use-encounter-feedback'
import { useST } from './use-st'

const BARS = 14
const DELTA_VISIBLE_MS = 2400

/** Fixed pseudo-random heights so the strip looks like speech but renders the same every time. */
const HEIGHTS = Array.from({ length: BARS }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + 0.6)))

export function AudioStrip({ talking, className }: { talking: boolean; className?: string }) {
  const reduced = useReducedMotion()
  return (
    <div aria-hidden="true" data-talking={talking} className={cn('flex h-4 flex-1 items-center justify-end gap-[3px]', className)}>
      {HEIGHTS.map((h, i) => (
        <motion.span
          key={i}
          className={cn('h-full w-[3px] origin-center rounded-full', talking ? 'bg-primary' : 'bg-line-strong')}
          initial={false}
          animate={talking ? { scaleY: reduced ? h : [0.25, h, 0.3, h * 0.8, 0.25] } : { scaleY: 0.16 }}
          transition={
            talking && !reduced
              ? { duration: 0.55 + (i % 5) * 0.07, repeat: Infinity, ease: 'easeInOut', delay: (i % 7) * 0.03 }
              : { duration: 0.15 }
          }
        />
      ))}
    </div>
  )
}

interface TrustHudProps {
  trust: number
  mood: Emotion
  talking: boolean
  feedback?: TurnFeedback
  /** Phone layout: tighter padding and a one-line reason. */
  compact?: boolean
  /** Keep the reason for screen readers only (phone with the sheet open). */
  hideReason?: boolean
  className?: string
}

/** The "+5" / "-3" chip: springs in on its own, then removes itself. Remounted per action via `key`. */
export function DeltaChip({ text, positive }: { text: string; positive: boolean }) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setVisible(false), DELTA_VISIBLE_MS)
    return () => clearTimeout(id)
  }, [])
  if (!visible) return null
  return (
    <motion.span
      data-testid="trust-delta"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? { duration: 0.2 } : spring.default}
    >
      <Badge variant={positive ? 'success' : 'danger'} className="tabular-nums">
        {text}
      </Badge>
    </motion.span>
  )
}

/** The emotion HUD (PRD section 8): trust meter, mood word, last change and why. Never idles. */
export function TrustHud({ trust, mood, talking, feedback, compact, hideReason, className }: TrustHudProps) {
  const st = useST()
  const percent = Math.round(Math.min(100, Math.max(0, trust)))
  const seq = feedback?.seq
  const deltaText = formatDelta(feedback?.delta)
  const meter = (
    <div
      role="meter"
      aria-label={st('hud.trust')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2.5 flex-1 overflow-hidden rounded-full bg-inset"
    >
      <div
        className={cn(
          'h-full w-full origin-left rounded-full transition-[transform,background-color] duration-500 ease-[var(--mq-ease-out)] motion-reduce:transition-none',
          MOOD_STYLE[mood].bar,
        )}
        style={{ transform: `scaleX(${percent / 100})` }}
      />
    </div>
  )
  const value = (
    <span className="flex w-[6.25rem] shrink-0 items-center gap-2 font-display text-heading-card font-bold text-ink-1 tabular-nums">
      <span data-testid="trust-percent">{percent}%</span>
      {seq !== undefined && deltaText && (
        <DeltaChip key={seq} text={deltaText} positive={(feedback?.delta ?? 0) > 0} />
      )}
    </span>
  )
  const reason = (
    <p aria-live="polite" className={cn('text-body-s text-ink-2', hideReason ? 'sr-only' : compact ? 'line-clamp-1' : 'min-h-[2.5rem]')} data-testid="trust-reason">
      {feedback?.reason ? st(`reason.${feedback.reason}`) : st('reason.idle')}
    </p>
  )
  const moodBadge = (
    <Badge className={MOOD_STYLE[mood].badge} data-testid="mood-badge">
      {st(`mood.${mood}`)}
    </Badge>
  )

  return (
    <section
      aria-label={st('hud.trust')}
      data-slot="trust-hud"
      className={cn('flex flex-col rounded-md border border-line bg-surface', compact ? 'gap-1.5 px-3 py-2.5' : 'gap-2 p-3.5', className)}
    >
      <div className="flex min-h-5 items-center justify-between gap-3">
        <h2 className="text-label font-semibold text-ink-2">{st('hud.trust')}</h2>
        {talking && <AudioStrip talking />}
        {moodBadge}
      </div>
      <div className="flex items-center gap-3">
        {value}
        {meter}
      </div>
      {reason}
    </section>
  )
}

/** Faint wash on the stage edge after a big trust change. Skipped under reduced motion. */
export function EdgeTint({ feedback }: { feedback?: TurnFeedback }) {
  const reduced = useReducedMotion()
  if (!feedback?.tint || reduced) return null
  return (
    <motion.div
      key={feedback.seq}
      aria-hidden="true"
      data-testid="edge-tint"
      className={cn(
        'pointer-events-none absolute inset-0 z-10 border-[6px]',
        feedback.tint === 'good' ? 'border-success/45 bg-success/5' : 'border-danger/45 bg-danger/5',
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.6, ease: 'easeOut', times: [0, 0.25, 1] }}
    />
  )
}
