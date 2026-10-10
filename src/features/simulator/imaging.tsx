import type { ComponentType, ReactNode } from 'react'
import { useST } from './use-st'

// Procedural, schematic imaging. Original drawings made of primitives, colours from tokens, never
// real patient images. Every figure is captioned as a synthetic illustration.

const W = 320
const H = 240
const INK = 'var(--mq-ink-1)'
const LIGHT = 'var(--mq-inset)'
const MID = 'var(--mq-ink-4)'
const ALERT = 'var(--mq-danger)'
const WARN = 'var(--mq-warning)'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Frame({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full rounded-sm">
      <rect width={W} height={H} fill={INK} />
      {children}
    </svg>
  )
}

// ---------- chest X-ray ----------

interface CxrOptions {
  heart?: number
  effusionRight?: boolean
  cavity?: boolean
  interstitial?: boolean
}

function Cxr({ heart = 1, effusionRight, cavity, interstitial }: CxrOptions) {
  const rand = rng(11)
  const ribs = Array.from({ length: 7 }, (_, i) => 52 + i * 21)
  return (
    <g>
      <path d="M160 24 V210" stroke={LIGHT} strokeWidth="7" opacity="0.5" />
      <path d="M60 50 Q160 34 260 50" stroke={LIGHT} strokeWidth="5" opacity="0.4" fill="none" />
      <ellipse cx="108" cy="124" rx="52" ry="82" fill={LIGHT} opacity="0.2" />
      <ellipse cx="212" cy="124" rx="52" ry="82" fill={LIGHT} opacity="0.2" />
      {ribs.map((y) => (
        <g key={y} stroke={LIGHT} strokeWidth="2" fill="none" opacity="0.45">
          <path d={`M62 ${y} Q108 ${y + 14} 156 ${y + 4}`} />
          <path d={`M164 ${y + 4} Q212 ${y + 14} 258 ${y}`} />
        </g>
      ))}
      <ellipse cx="178" cy="152" rx={40 * heart} ry={44 * heart} fill={LIGHT} opacity="0.55" />
      <path d="M118 66 Q108 52 92 60 M202 66 Q212 52 228 60" stroke={LIGHT} strokeWidth="4" opacity="0.5" fill="none" />
      {cavity && (
        <g>
          <circle cx="98" cy="86" r="18" fill={MID} opacity="0.35" />
          <circle cx="98" cy="86" r="9" fill={INK} opacity="0.85" />
          <circle cx="98" cy="86" r="18" fill="none" stroke={LIGHT} strokeWidth="2.5" opacity="0.8" />
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={78 + rand() * 38} cy={70 + rand() * 50} r={1.6 + rand() * 2} fill={LIGHT} opacity="0.7" />
          ))}
        </g>
      )}
      {effusionRight && <path d="M60 206 Q64 150 96 150 Q132 150 156 160 V206 Z" fill={LIGHT} opacity="0.7" />}
      {interstitial &&
        Array.from({ length: 44 }, (_, i) => {
          const left = i % 2 === 0
          const x = left ? 70 + rand() * 76 : 176 + rand() * 76
          const y = 70 + rand() * 110
          return <path key={i} d={`M${x} ${y} l${6 + rand() * 6} ${rand() * 5 - 2}`} stroke={LIGHT} strokeWidth="1.4" opacity="0.5" />
        })}
      <text x="14" y="26" fill={LIGHT} fontSize="11" opacity="0.8">
        PA
      </text>
      <text x="306" y="26" fill={LIGHT} fontSize="11" opacity="0.8" textAnchor="end">
        R
      </text>
    </g>
  )
}

// ---------- ECG ----------

interface LeadSpec {
  name: string
  r: number
  st: number
  t: number
  inv?: boolean
}

/** One beat as a polyline in a 100 wide cell; `st` lifts the ST segment. */
function beat(x0: number, base: number, o: { r: number; st: number; t: number; inv?: boolean }) {
  const s = o.inv ? -1 : 1
  const p = (dx: number, dy: number) => `${x0 + dx} ${base - s * dy}`
  return [
    p(0, 0), p(8, 0), p(12, 4), p(16, 0), p(24, 0), p(27, -5), p(30, o.r), p(34, -9), p(37, o.st),
    p(46, o.st), p(54, o.st + o.t), p(62, o.st), p(70, 0), p(100, 0),
  ].join(' L')
}

function EcgStrip({ leads }: { leads: LeadSpec[] }) {
  const row = H / leads.length
  return (
    <g>
      {Array.from({ length: Math.floor(W / 16) + 1 }, (_, i) => (
        <line key={`v${i}`} x1={i * 16} y1="0" x2={i * 16} y2={H} stroke={LIGHT} strokeWidth={i % 5 === 0 ? 0.7 : 0.25} opacity="0.35" />
      ))}
      {Array.from({ length: Math.floor(H / 16) + 1 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 16} x2={W} y2={i * 16} stroke={LIGHT} strokeWidth={i % 5 === 0 ? 0.7 : 0.25} opacity="0.35" />
      ))}
      {leads.map((lead, i) => {
        const base = row * i + row * 0.62
        const sc = row / 90
        const d = [0, 1, 2]
          .map((n) => beat(18 + n * 100, base, { r: lead.r * sc, st: lead.st * sc, t: lead.t * sc, inv: lead.inv }))
          .map((seg, n) => `${n === 0 ? 'M' : 'L'}${seg}`)
          .join(' ')
        return (
          <g key={lead.name}>
            <text x="4" y={row * i + 14} fill={LIGHT} fontSize="11">
              {lead.name}
            </text>
            <path d={d} fill="none" stroke={LIGHT} strokeWidth="1.6" strokeLinejoin="round" />
          </g>
        )
      })}
    </g>
  )
}

const STEMI_LEADS: LeadSpec[] = [
  { name: 'II', r: 24, st: 0, t: 6 },
  { name: 'V2', r: 20, st: 26, t: 18 },
  { name: 'V3', r: 22, st: 30, t: 20 },
  { name: 'V4', r: 24, st: 24, t: 16 },
]
const LVH_LEADS: LeadSpec[] = [
  { name: 'V1', r: 10, st: 0, t: -6, inv: true },
  { name: 'V2', r: 14, st: -3, t: -8, inv: true },
  { name: 'V5', r: 58, st: -6, t: -10 },
  { name: 'V6', r: 52, st: -5, t: -9 },
]

// ---------- echo, smear, ultrasound ----------

function Echo() {
  return (
    <g>
      <path d="M160 14 L36 210 A140 140 0 0 0 284 210 Z" fill={MID} opacity="0.18" />
      <path d="M160 14 L36 210 A140 140 0 0 0 284 210 Z" fill="none" stroke={LIGHT} strokeWidth="1.2" opacity="0.5" />
      <ellipse cx="160" cy="128" rx="46" ry="72" fill={INK} stroke={LIGHT} strokeWidth="9" opacity="0.95" />
      <path d="M118 96 Q112 128 122 160" stroke={WARN} strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="238" cy="108" rx="24" ry="38" fill={INK} stroke={LIGHT} strokeWidth="5" opacity="0.8" />
      <text x="16" y="230" fill={WARN} fontSize="11">
        segmen anterior hipokinetik
      </text>
      <text x="160" y="132" fill={LIGHT} fontSize="11" textAnchor="middle">
        LV
      </text>
    </g>
  )
}

function Smear() {
  const rand = rng(5)
  const cells = Array.from({ length: 46 }, () => ({ x: 24 + rand() * 272, y: 24 + rand() * 180, r: 11 + rand() * 3 }))
  const parasitized = new Set([4, 9, 15, 22, 30, 37])
  return (
    <g>
      <circle cx="160" cy="112" r="108" fill={MID} opacity="0.22" />
      {cells.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={c.r} fill={LIGHT} opacity="0.55" />
          <circle cx={c.x} cy={c.y} r={c.r * 0.45} fill={MID} opacity="0.4" />
          {parasitized.has(i) && (
            <g>
              <circle cx={c.x + 3} cy={c.y - 2} r="4.2" fill="none" stroke={ALERT} strokeWidth="1.8" />
              <circle cx={c.x + 7} cy={c.y - 5} r="1.5" fill={ALERT} />
            </g>
          )}
        </g>
      ))}
      <text x="16" y="230" fill={LIGHT} fontSize="11">
        bentuk cincin P. falciparum
      </text>
    </g>
  )
}

function Usg() {
  const rand = rng(21)
  return (
    <g>
      <path d="M160 10 L30 214 A150 150 0 0 0 290 214 Z" fill={MID} opacity="0.2" />
      {Array.from({ length: 160 }, (_, i) => (
        <circle key={i} cx={70 + rand() * 180} cy={40 + rand() * 170} r={0.8 + rand() * 1.2} fill={LIGHT} opacity={0.25 + rand() * 0.35} />
      ))}
      <path d="M118 124 Q140 96 190 112 Q214 142 188 176 Q146 190 120 160 Z" fill={INK} opacity="0.95" />
      <text x="154" y="148" fill={LIGHT} fontSize="11" textAnchor="middle">
        cairan bebas
      </text>
    </g>
  )
}

// ---------- registry ----------

interface Renderer {
  /** Short Indonesian clinical label. */
  label: string
  render: ComponentType
}

export const IMAGING: Record<string, Renderer> = {
  'cxr-normal': { label: 'Foto toraks PA, normal', render: () => <Cxr /> },
  'cxr-mild-cardiomegaly': { label: 'Foto toraks PA, kardiomegali ringan', render: () => <Cxr heart={1.28} /> },
  'cxr-interstitial-mild': { label: 'Foto toraks PA, corakan interstisial', render: () => <Cxr interstitial /> },
  'cxr-pleural-effusion-right': { label: 'Foto toraks PA, efusi pleura kanan', render: () => <Cxr effusionRight /> },
  'cxr-tb-upper-lobe-cavity': { label: 'Foto toraks PA, kavitas lobus atas', render: () => <Cxr cavity /> },
  'ecg-stemi-anterior': { label: 'EKG, elevasi ST anterior', render: () => <EcgStrip leads={STEMI_LEADS} /> },
  'ecg-lvh': { label: 'EKG, hipertrofi ventrikel kiri', render: () => <EcgStrip leads={LVH_LEADS} /> },
  'echo-anterior-hypokinesis': { label: 'Ekokardiografi, hipokinesis anterior', render: Echo },
  'smear-falciparum': { label: 'Apusan darah tipis, P. falciparum', render: Smear },
  'usg-free-fluid': { label: 'USG abdomen, cairan bebas', render: Usg },
}

export const hasImagingRenderer = (imageId: string) => imageId in IMAGING

export function ImagingViewer({ imageId }: { imageId: string }) {
  const st = useST()
  const entry = IMAGING[imageId]
  const label = entry?.label ?? imageId
  const Render = entry?.render
  return (
    <figure data-slot="imaging-viewer" className="flex flex-col gap-2">
      <Frame label={`${label}. ${st('imaging.synthetic')}`}>
        {Render ? (
          <Render />
        ) : (
          <text x="160" y="124" fill={LIGHT} fontSize="12" textAnchor="middle">
            {st('imaging.missing')}
          </text>
        )}
      </Frame>
      <figcaption className="flex flex-col text-label text-ink-muted">
        <span className="font-semibold text-ink-2">{label}</span>
        <span>{st('imaging.synthetic')}</span>
      </figcaption>
    </figure>
  )
}
