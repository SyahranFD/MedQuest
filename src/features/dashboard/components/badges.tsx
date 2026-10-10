import { BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Band, Case, Difficulty, Mode } from '@/features/cases/types'
import { BAND_VARIANT, caseCategory, shortIssuer, STATUS_VARIANT } from '../format'
import type { MissedCriterion, StudentStatus } from '../types'
import { useDt } from '../use-dt'

export function BandBadge({ band }: { band: Band }) {
  const { dt } = useDt()
  return <Badge variant={BAND_VARIANT[band]}>{dt(`band.${band}`)}</Badge>
}

export function StatusBadge({ status }: { status: StudentStatus }) {
  const { dt } = useDt()
  return <Badge variant={STATUS_VARIANT[status]}>{dt(`status.${status}`)}</Badge>
}

export function ModeBadge({ mode }: { mode: Mode }) {
  const { dt } = useDt()
  return <Badge variant="neutral">{dt(`mode.${mode}`)}</Badge>
}

export function SampleBadge() {
  const { dt } = useDt()
  return <Badge variant="neutral">{dt('sample')}</Badge>
}

export function CategoryBadge({ kase }: { kase: Pick<Case, 'guidelineIds'> }) {
  const { dt } = useDt()
  const category = caseCategory(kase)
  return (
    <Badge variant="category" category={category}>
      {dt(`category.${category}`)}
    </Badge>
  )
}

const BARS: Record<Difficulty, number> = { mudah: 1, sedang: 2, sulit: 3 }

/** Three small bars plus the label; neutral on purpose, difficulty is not a status. */
export function DifficultyMark({ difficulty }: { difficulty: Difficulty }) {
  const { dt } = useDt()
  return (
    <span className="inline-flex items-center gap-1.5 text-body-s text-ink-2">
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
