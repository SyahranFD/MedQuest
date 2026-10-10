import type { Emotion } from '@/lib/emotion'
import type { ClinicSceneProps } from '@/lib/scene-contract'
import { useClinicCopy } from './copy'
import { EMOTION_PARAMS } from './expression'

// Static illustrative fallback when WebGL is unavailable or the scene failed. Pure SVG with
// design-token fills (no three.js import, so it ships in the light chunk).

const fill = (token: string) => ({ fill: `var(${token})` })

function Face({ cx, cy, r, emotion }: { cx: number; cy: number; r: number; emotion: Emotion }) {
  const p = EMOTION_PARAMS[emotion]
  const ink = { stroke: 'var(--mq-ink-1)', strokeWidth: r * 0.08, strokeLinecap: 'round' as const, fill: 'none' }
  const eyeY = cy - r * 0.05
  const browY = cy - r * 0.36
  const mouthY = cy + r * 0.42
  const curve = -p.mouthCurve * r * 0.28
  const tilt = (side: -1 | 1, deg: number) => Math.tan((deg * Math.PI) / 180) * r * 0.2 * (side === -1 ? 1 : 1)
  const brow = (side: -1 | 1, deg: number, h: number) => {
    const x = cx + side * r * 0.36
    const inner = -tilt(side, deg)
    const lift = (h - 0.15) * -r * 0.9
    return `M${x - side * r * 0.2} ${browY + lift - inner * -1} L${x + side * r * 0.2} ${browY + lift + inner * -1}`
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} style={fill('--mq-tint-amber')} stroke="var(--mq-line-strong)" strokeWidth={2} />
      <circle cx={cx - r * 0.36} cy={eyeY} r={r * 0.07} style={fill('--mq-ink-1')} />
      <circle cx={cx + r * 0.36} cy={eyeY} r={r * 0.07} style={fill('--mq-ink-1')} />
      <path d={brow(-1, p.browTiltL, p.browHeightL)} style={ink} />
      <path d={brow(1, p.browTiltR, p.browHeightR)} style={ink} />
      <path d={`M${cx - r * 0.3} ${mouthY} Q${cx} ${mouthY + curve * 2} ${cx + r * 0.3} ${mouthY}`} style={ink} />
    </g>
  )
}

export function SceneFallback({
  mode,
  patients,
  activePatientId,
  className,
}: Pick<ClinicSceneProps, 'mode' | 'patients' | 'activePatientId'> & { className?: string }) {
  const copy = useClinicCopy()
  const beds = mode === 'er' ? 3 : 1
  const active = patients.find((p) => p.id === activePatientId) ?? patients[0]
  return (
    <div className={className} role="img" aria-label={mode === 'er' ? copy.labelEr : copy.labelPoli}>
      <svg viewBox="0 0 800 500" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="800" height="500" style={fill('--mq-clay-cream')} />
        <rect y="330" width="800" height="170" style={fill('--mq-panel')} />
        <rect x="70" y="60" width="240" height="170" rx="6" style={fill('--mq-tint-blue')} stroke="var(--mq-line-strong)" strokeWidth={4} />
        <line x1="190" y1="60" x2="190" y2="230" stroke="var(--mq-line-strong)" strokeWidth={4} />
        {Array.from({ length: beds }, (_, i) => {
          const x = beds === 1 ? 470 : 150 + i * 250
          return (
            <g key={i}>
              <rect x={x} y="300" width="190" height="34" rx="8" style={fill('--mq-surface')} stroke="var(--mq-line-strong)" strokeWidth={2} />
              <rect x={x + 10} y="334" width="10" height="60" style={fill('--mq-ink-4')} />
              <rect x={x + 170} y="334" width="10" height="60" style={fill('--mq-ink-4')} />
              <rect x={x} y="270" width="46" height="34" rx="8" style={fill('--mq-tint-green')} />
            </g>
          )
        })}
        {active && <Face cx={beds === 1 ? 500 : 190} cy={250} r={44} emotion={active.visual.emotion} />}
        <rect x="0" y="330" width="800" height="3" style={fill('--mq-line')} />
      </svg>
      <p className="sr-only">{copy.fallbackNote}</p>
    </div>
  )
}
