import { BookOpen, Brain, Bug, Droplets, HeartPulse, Wind, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeCategory } from '@/components/ui/badge'
import type { Band, Case, Difficulty, Mode } from '@/features/cases/types'
import { BAND_VARIANT, caseCategory, shortIssuer, STATUS_VARIANT } from '../format'
import type { MissedCriterion, StudentStatus } from '../types'
import { useDt } from '../use-dt'

export function BandBadge({ band }: { band: Band }) {
  const { dt } = useDt()
  return <Badge variant={BAND_VARIANT[band]}>{dt(`band.${band}`)}</Badge>
}

/** Only states that ask for action get a chip; on-track is plain muted text so a long list stays calm. */
export function StatusBadge({ status }: { status: StudentStatus }) {
  const { dt } = useDt()
  if (status === 'on-track') return <span className="text-meta text-ink-3">{dt(`status.${status}`)}</span>
  return <Badge variant={STATUS_VARIANT[status]}>{dt(`status.${status}`)}</Badge>
}

/** Mode is a property, not a state: plain muted text. */
export function ModeLabel({ mode }: { mode: Mode }) {
  const { dt } = useDt()
  return <span className="text-meta text-ink-3">{dt(`mode.${mode}`)}</span>
}

export function SampleBadge() {
  const { dt } = useDt()
  return <Badge variant="neutral" className="ml-2 align-middle">{dt('sample')}</Badge>
}

const CATEGORY_ICON: Record<BadgeCategory, LucideIcon> = {
  infection: Bug,
  cardio: HeartPulse,
  endocrine: Droplets,
  pulmo: Wind,
  neuro: Brain,
}

/** Specialty is never a colour chip: muted text with a 14px icon. */
export function CategoryLabel({ kase }: { kase: Pick<Case, 'guidelineIds'> }) {
  const { dt } = useDt()
  const category = caseCategory(kase)
  const Icon = CATEGORY_ICON[category]
  return (
    <span className="inline-flex items-center gap-1.5 text-meta text-ink-3">
      <Icon aria-hidden="true" size={14} strokeWidth={1.5} />
      {dt(`category.${category}`)}
    </span>
  )
}

const BARS: Record<Difficulty, number> = { mudah: 1, sedang: 2, sulit: 3 }

/** Three small bars plus the label; neutral on purpose, difficulty is not a status. */
export function DifficultyMark({ difficulty }: { difficulty: Difficulty }) {
  const { dt } = useDt()
  return (
    <span className="inline-flex items-center gap-1.5 text-meta text-ink-3">
      <span aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`w-1 rounded-full ${n <= BARS[difficulty] ? 'bg-ink-2' : 'bg-line-strong'}`} style={{ height: 4 + n * 3 }} />
        ))}
      </span>
      {dt(`difficulty.${difficulty}`)}
    </span>
  )
}

/** Guideline chip: abbreviation visible, full title for assistive tech. */
export function CiteChip({ cite }: { cite: NonNullable<MissedCriterion['cite']> }) {
  const label = `${shortIssuer(cite.issuer)}${cite.year ? ` ${cite.year}` : ''}`
  return (
    <Badge variant="neutral" title={cite.title}>
      <BookOpen aria-hidden="true" />
      {label}
      <span className="sr-only">{`: ${cite.title}`}</span>
    </Badge>
  )
}
