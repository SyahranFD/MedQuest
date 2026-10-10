import type { CSSProperties, ReactNode } from 'react'
import type { ClayObjectName } from './objects/builders'

type Hue = 'green' | 'cream' | 'sky' | 'coral' | 'butter'

const fill = (hue: Hue): CSSProperties => ({ fill: `var(--mq-clay-${hue})` })
const deep: CSSProperties = { fill: 'var(--mq-primary)' }
const paper: CSSProperties = { fill: 'var(--mq-surface)' }
const stroke = (hue: Hue | 'primary', width: number): CSSProperties => ({
  fill: 'none',
  stroke: hue === 'primary' ? 'var(--mq-primary)' : `var(--mq-clay-${hue})`,
  strokeWidth: width,
  strokeLinecap: 'round',
})

/** Flat, token-colored stand-ins for the 3D objects (100 x 100 box, centred on 50,50). */
const GLYPHS: Record<ClayObjectName, ReactNode> = {
  briefcase: (
    <>
      <path d="M38 24 v-6 a6 6 0 0 1 6-6 h12 a6 6 0 0 1 6 6 v6" style={stroke('primary', 5)} />
      <rect x="16" y="22" width="68" height="64" rx="14" style={fill('cream')} />
      <rect x="24" y="22" width="14" height="64" rx="4" style={fill('green')} />
      <rect x="62" y="22" width="14" height="64" rx="4" style={fill('green')} />
      <path d="M38 26 L50 70 L62 26" style={stroke('green', 11)} />
      <rect x="22" y="22" width="18" height="9" rx="3" style={fill('sky')} />
      <rect x="60" y="22" width="18" height="9" rx="3" style={fill('sky')} />
    </>
  ),
  pill: (
    <g transform="rotate(-40 50 50)">
      <rect x="14" y="34" width="72" height="32" rx="16" style={fill('cream')} />
      <path d="M50 34 H30 a16 16 0 0 0 0 32 H50 Z" style={fill('green')} />
    </g>
  ),
  cross: (
    <>
      <rect x="14" y="76" width="72" height="10" rx="5" style={fill('cream')} />
      <rect x="18" y="38" width="64" height="24" rx="10" style={fill('coral')} />
      <rect x="38" y="18" width="24" height="64" rx="10" style={fill('coral')} />
    </>
  ),
  heart: <path d="M50 84 C20 62 12 44 20 30 C28 18 44 22 50 36 C56 22 72 18 80 30 C88 44 80 62 50 84 Z" style={fill('coral')} />,
  stethoscope: (
    <>
      <path d="M28 14 C26 40 36 52 50 52 C64 52 74 40 72 14" style={stroke('sky', 6)} />
      <path d="M50 52 V66 C50 82 74 82 74 66" style={stroke('sky', 6)} />
      <circle cx="74" cy="64" r="11" style={fill('cream')} />
      <circle cx="74" cy="64" r="5" style={fill('green')} />
      <circle cx="28" cy="14" r="5" style={fill('cream')} />
      <circle cx="72" cy="14" r="5" style={fill('cream')} />
    </>
  ),
  syringe: (
    <g transform="rotate(40 50 50)">
      <rect x="40" y="12" width="20" height="8" rx="4" style={fill('green')} />
      <rect x="47" y="18" width="6" height="14" style={fill('cream')} />
      <rect x="36" y="30" width="28" height="6" rx="3" style={fill('cream')} />
      <rect x="38" y="34" width="24" height="42" rx="9" style={paper} />
      <rect x="38" y="52" width="24" height="24" rx="9" style={fill('butter')} />
      <path d="M44 76 h12 l-4 8 h-4 Z" style={fill('cream')} />
      <rect x="49" y="82" width="2" height="12" style={fill('green')} />
    </g>
  ),
  thermometer: (
    <g transform="rotate(35 50 50)">
      <rect x="42" y="10" width="16" height="66" rx="8" style={paper} />
      <rect x="47" y="30" width="6" height="44" rx="3" style={fill('coral')} />
      <circle cx="50" cy="78" r="13" style={fill('coral')} />
      <rect x="58" y="22" width="6" height="2" style={fill('green')} />
      <rect x="58" y="32" width="9" height="2" style={fill('green')} />
      <rect x="58" y="42" width="6" height="2" style={fill('green')} />
    </g>
  ),
  clipboard: (
    <>
      <rect x="20" y="14" width="60" height="76" rx="9" style={fill('green')} />
      <rect x="26" y="26" width="48" height="58" rx="4" style={paper} />
      <rect x="38" y="10" width="24" height="12" rx="5" style={fill('sky')} />
      <rect x="44" y="40" width="24" height="4" rx="2" style={fill('cream')} />
      <rect x="44" y="54" width="24" height="4" rx="2" style={fill('cream')} />
      <rect x="44" y="68" width="24" height="4" rx="2" style={fill('cream')} />
      <path d="M31 41 l4 4 l7 -9" style={stroke('green', 3)} />
    </>
  ),
  firstAid: (
    <>
      <path d="M38 30 v-8 a12 12 0 0 1 24 0 v8" style={stroke('cream', 5)} />
      <rect x="12" y="30" width="76" height="52" rx="12" style={fill('green')} />
      <rect x="12" y="44" width="76" height="4" style={deep} />
      <rect x="32" y="55" width="36" height="10" rx="4" style={paper} />
      <rect x="45" y="48" width="10" height="24" rx="4" style={paper} />
    </>
  ),
  plaster: (
    <g transform="rotate(-28 50 50)">
      <rect x="8" y="34" width="84" height="32" rx="14" style={fill('butter')} />
      <rect x="34" y="34" width="32" height="32" rx="4" style={paper} />
      <circle cx="20" cy="45" r="2.2" style={fill('cream')} />
      <circle cx="20" cy="55" r="2.2" style={fill('cream')} />
      <circle cx="80" cy="45" r="2.2" style={fill('cream')} />
      <circle cx="80" cy="55" r="2.2" style={fill('cream')} />
    </g>
  ),
  potion: (
    <>
      <rect x="40" y="8" width="20" height="14" rx="5" style={fill('cream')} />
      <path d="M42 22 h16 v10 c14 6 22 16 22 30 c0 16 -10 24 -30 24 c-20 0 -30 -8 -30 -24 c0 -14 8 -24 22 -30 Z" style={fill('sky')} />
      <rect x="22" y="56" width="56" height="18" rx="5" style={paper} />
      <rect x="46" y="59" width="8" height="12" rx="2" style={fill('coral')} />
      <rect x="42" y="63" width="16" height="4" rx="2" style={fill('coral')} />
    </>
  ),
}

export type ClayFallbackVariant = 'hero' | 'rail' | 'cta' | 'card'

interface Placement {
  name: ClayObjectName
  x: number
  y: number
  s: number
}

const LAYOUTS: Record<Exclude<ClayFallbackVariant, 'card'>, { viewBox: string; items: Placement[]; ground?: boolean }> = {
  hero: {
    viewBox: '0 0 480 420',
    ground: true,
    items: [
      { name: 'stethoscope', x: 44, y: 90, s: 1.35 },
      { name: 'clipboard', x: 360, y: 60, s: 1.4 },
      { name: 'heart', x: 366, y: 232, s: 1.2 },
      { name: 'pill', x: 20, y: 250, s: 1.3 },
      { name: 'briefcase', x: 130, y: 70, s: 2.2 },
      { name: 'potion', x: 300, y: 300, s: 0.95 },
      { name: 'syringe', x: 120, y: 296, s: 0.95 },
    ],
  },
  rail: {
    viewBox: '0 0 360 160',
    items: [
      { name: 'clipboard', x: 20, y: 24, s: 1.1 },
      { name: 'heart', x: 130, y: 36, s: 1.0 },
      { name: 'pill', x: 235, y: 22, s: 1.1 },
    ],
  },
  cta: {
    viewBox: '0 0 520 200',
    ground: true,
    items: [
      { name: 'plaster', x: 10, y: 60, s: 1.1 },
      { name: 'firstAid', x: 112, y: 40, s: 1.3 },
      { name: 'briefcase', x: 232, y: 10, s: 1.6 },
      { name: 'thermometer', x: 366, y: 40, s: 1.2 },
      { name: 'potion', x: 440, y: 66, s: 0.95 },
    ],
  },
}

/** Static, token-colored composition shown while the 3D chunk loads or when WebGL is unavailable. */
export function ClayFallback({ variant, object = 'briefcase', className }: { variant: ClayFallbackVariant; object?: ClayObjectName; className?: string }) {
  if (variant === 'card') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(14 14) scale(0.72)">{GLYPHS[object]}</g>
      </svg>
    )
  }
  const layout = LAYOUTS[variant]
  const [, , w, h] = layout.viewBox.split(' ').map(Number) as [number, number, number, number]
  return (
    <svg viewBox={layout.viewBox} className={className} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {layout.ground && <ellipse cx={w / 2} cy={h * 0.78} rx={w * 0.42} ry={h * 0.12} style={{ fill: 'var(--mq-tint-green)' }} />}
      {layout.items.map((it) => (
        <g key={it.name} transform={`translate(${it.x} ${it.y}) scale(${it.s})`}>
          {GLYPHS[it.name]}
        </g>
      ))}
    </svg>
  )
}
