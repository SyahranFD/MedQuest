import type { EmotionTracePoint } from '@/features/cases/types'
import { useST } from './use-st'

const W = 240
const H = 64
const PAD = 6

/** Trust over time from the emotion trace: a plain line with the end points marked. */
export function TrustSparkline({ trace }: { trace: readonly EmotionTracePoint[] }) {
  const st = useST()
  if (trace.length < 2) return null
  const t0 = trace[0]!.atSec
  const span = Math.max(1, trace[trace.length - 1]!.atSec - t0)
  const x = (t: number) => PAD + ((t - t0) / span) * (W - PAD * 2)
  const y = (trust: number) => H - PAD - (Math.min(100, Math.max(0, trust)) / 100) * (H - PAD * 2)
  const points = trace.map((p) => `${x(p.atSec).toFixed(1)},${y(p.trust).toFixed(1)}`)
  const first = trace[0]!
  const last = trace[trace.length - 1]!
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={st('debrief.sparkline', { from: Math.round(first.trust), to: Math.round(last.trust) })}
      className="h-16 w-full"
      data-testid="trust-sparkline"
    >
      <line x1={PAD} x2={W - PAD} y1={y(50)} y2={y(50)} stroke="var(--mq-line-strong)" strokeDasharray="3 4" strokeWidth="1" />
      <polyline points={points.join(' ')} fill="none" stroke="var(--mq-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(first.atSec)} cy={y(first.trust)} r="3.5" fill="var(--mq-surface)" stroke="var(--mq-primary)" strokeWidth="2" />
      <circle cx={x(last.atSec)} cy={y(last.trust)} r="3.5" fill="var(--mq-primary)" />
    </svg>
  )
}
