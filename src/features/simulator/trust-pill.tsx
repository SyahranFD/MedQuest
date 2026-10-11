import type { Emotion } from '@/lib/emotion'
import { cn } from '@/lib/utils'
import { formatDelta, MOOD_STYLE } from './mood'
import { DeltaChip, TrustHud } from './trust-hud'
import type { TurnFeedback } from './use-encounter-feedback'
import { useST } from './use-st'

interface TrustPillProps {
  trust: number
  mood: Emotion
  talking: boolean
  feedback?: TurnFeedback
  className?: string
}

/**
 * Trust, collapsed: percent, a thin bar and the mood word. Hover or keyboard focus opens the full
 * meter with the reason underneath (plain CSS transitions, so it can be interrupted at any frame).
 */
export function TrustPill({ trust, mood, talking, feedback, className }: TrustPillProps) {
  const st = useST()
  const percent = Math.round(Math.min(100, Math.max(0, trust)))
  const deltaText = formatDelta(feedback?.delta)
  return (
    <div className={cn('group relative w-fit', className)} data-testid="trust-pill">
      <button
        type="button"
        aria-label={`${st('hud.trust')} ${percent}%. ${st('hud.trustOpen')}`}
        className="mq-translucent flex min-h-9 items-center gap-2.5 rounded-full border border-line py-1.5 pr-3.5 pl-3 text-body-s text-ink-1 outline-offset-2 pointer-coarse:min-h-11"
      >
        <span className="font-semibold tabular-nums">{percent}%</span>
        <span aria-hidden="true" className="h-1.5 w-14 overflow-hidden rounded-full bg-inset">
          <span
            className={cn('block h-full w-full origin-left rounded-full transition-transform duration-500 ease-[var(--mq-ease-out)] motion-reduce:transition-none', MOOD_STYLE[mood].bar)}
            style={{ transform: `scaleX(${percent / 100})` }}
          />
        </span>
        <span className="text-ink-2">{st(`mood.${mood}`)}</span>
        {feedback?.seq !== undefined && deltaText && <DeltaChip key={feedback.seq} text={deltaText} positive={(feedback.delta ?? 0) > 0} />}
      </button>
      <div className="pointer-events-none absolute top-full left-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] -translate-y-1 opacity-0 transition-[opacity,transform] duration-150 ease-out group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transform-none">
        <TrustHud trust={trust} mood={mood} talking={talking} feedback={feedback} />
      </div>
    </div>
  )
}
