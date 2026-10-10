import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLT } from './use-lt'

type ArtKey = 'rail.f1' | 'rail.f2' | 'rail.f5' | 'rail.f6'

const BEDS = [
  { complaint: 'rail.a.c1', status: 'rail.a.critical', variant: 'danger' },
  { complaint: 'rail.a.c2', status: 'rail.a.urgent', variant: 'warning' },
  { complaint: 'rail.a.c3', status: 'rail.a.stable', variant: 'success' },
] as const

const VITALS = [
  { label: 'mockup.bp', value: '110/70' },
  { label: 'mockup.hr', value: '92' },
  { label: 'mockup.temp', value: '38,6' },
  { label: 'mockup.rr', value: '20' },
] as const

const SKILLS = [
  { label: 'rail.a.k1', fill: 'w-[82%]' },
  { label: 'rail.a.k2', fill: 'w-[64%]' },
  { label: 'rail.a.k3', fill: 'w-[48%]' },
  { label: 'rail.a.k4', fill: 'w-[72%]' },
] as const

const PANEL = 'rounded-md border border-line bg-surface p-4'

function Beds() {
  const lt = useLT()
  return (
    <ul className="flex flex-col gap-2">
      {BEDS.map((b, i) => (
        <li key={b.complaint} className={cn(PANEL, 'flex items-center justify-between gap-3 px-3.5 py-3')}>
          <span className="flex flex-col">
            <span className="text-label text-ink-muted">
              {lt('rail.a.bed')} {i + 1}
            </span>
            <span className="text-body-s font-semibold text-ink-1">{lt(b.complaint)}</span>
          </span>
          <Badge variant={b.variant}>{lt(b.status)}</Badge>
        </li>
      ))}
    </ul>
  )
}

function Vitals() {
  const lt = useLT()
  return (
    <dl className="grid grid-cols-2 gap-2">
      {VITALS.map((v) => (
        <div key={v.label} className={cn(PANEL, 'flex flex-col gap-0.5 px-3.5 py-3')}>
          <dt className="text-label text-ink-muted">{lt(v.label)}</dt>
          <dd className="font-display text-heading-card font-semibold text-ink-1 tabular-nums">{v.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Skills() {
  const lt = useLT()
  return (
    <ul className={cn(PANEL, 'flex flex-col gap-3.5 p-4')}>
      {SKILLS.map((s) => (
        <li key={s.label} className="flex flex-col gap-1.5">
          <span className="text-label text-ink-2">{lt(s.label)}</span>
          <span className="block h-2 rounded-full bg-panel">
            <span className={cn('block h-full rounded-full bg-neutral', s.fill)} />
          </span>
        </li>
      ))}
    </ul>
  )
}

const TROPICAL = [
  { label: 'rail.a.t1', tilt: '-rotate-3', shift: '' },
  { label: 'rail.a.t2', tilt: 'rotate-2', shift: 'ml-8' },
  { label: 'rail.a.t3', tilt: '-rotate-1', shift: 'ml-3' },
] as const

function Tropical() {
  const lt = useLT()
  return (
    <ul className="flex flex-col items-start gap-2.5">
      {TROPICAL.map((c) => (
        <li key={c.label} className={cn(c.tilt, c.shift)}>
          <Badge variant="category" category="infection" className="px-4 py-2 font-display text-heading-card">
            {lt(c.label)}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

const ART: Record<ArtKey, () => React.JSX.Element> = {
  'rail.f1': Beds,
  'rail.f2': Vitals,
  'rail.f5': Skills,
  'rail.f6': Tropical,
}

export function isArtKey(key: string): key is ArtKey {
  return key in ART
}

/** Mini product previews for the rail cards that have no clay object. Decorative; the card text carries the meaning. */
export function RailArt({ name }: { name: ArtKey }) {
  const Art = ART[name]
  return (
    <div aria-hidden="true" className="absolute inset-x-5 bottom-5">
      <Art />
    </div>
  )
}
