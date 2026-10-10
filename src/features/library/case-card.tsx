import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { Bug, Check, Clock, Droplets, HeartPulse, Brain, Wind, type LucideIcon } from 'lucide-react'
import { Badge, type BadgeCategory } from '@/components/ui/badge'
import type { Case } from '@/features/cases/types'
import { cn } from '@/lib/utils'
import { caseCategory, estimateMinutes, type CaseProgress } from './filter'
import { useLt } from './use-lt'

const ICONS: Record<BadgeCategory, LucideIcon> = {
  infection: Bug,
  cardio: HeartPulse,
  endocrine: Droplets,
  pulmo: Wind,
  neuro: Brain,
}

const TINTS: Record<BadgeCategory, string> = {
  infection: 'bg-tint-blue',
  cardio: 'bg-tint-coral',
  endocrine: 'bg-tint-amber',
  pulmo: 'bg-tint-teal',
  neuro: 'bg-tint-green',
}

export function CategoryBadge({ category }: { category: BadgeCategory }) {
  const lt = useLt()
  return (
    <Badge variant="category" category={category}>
      {lt(`category.${category}`)}
    </Badge>
  )
}

const BARS = { mudah: 1, sedang: 2, sulit: 3 } as const

export function DifficultyMark({ difficulty }: { difficulty: Case['difficulty'] }) {
  const lt = useLt()
  return (
    <span className="inline-flex items-center gap-1.5 text-body-s text-ink-2">
      <span aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn('w-1 rounded-full', n <= BARS[difficulty] ? 'bg-ink-2' : 'bg-line-strong')} style={{ height: 4 + n * 3 }} />
        ))}
      </span>
      {lt(`difficulty.${difficulty}`)}
    </span>
  )
}

/** One case: quiet tint field (E1), hairline border, solid specialty badge, status from history. */
export function CaseCard({ kase, progress }: { kase: Case; progress: CaseProgress }) {
  const lt = useLt()
  const titleId = useId()
  const category = caseCategory(kase)
  const Icon = ICONS[category]
  return (
    <li className="min-w-0">
      <Link
        to={'/app/kasus/$caseId' as '/'}
        params={{ caseId: kase.id } as never}
        aria-labelledby={titleId}
        className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface transition-[border-color,transform] duration-100 ease-out hover:border-line-strong active:scale-[.99]"
      >
        <div className={cn('flex h-28 items-end justify-between p-4', TINTS[category])}>
          <Icon aria-hidden="true" className="size-11 text-ink-1" strokeWidth={1.5} />
          <Badge variant="neutral">{lt(`mode.${kase.mode}`)}</Badge>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CategoryBadge category={category} />
            {progress.status === 'completed' ? (
              <Badge variant="success">
                <Check aria-hidden="true" />
                {lt('status.completed')}
              </Badge>
            ) : (
              <Badge variant="neutral">{lt('status.new')}</Badge>
            )}
          </div>
          <h2 id={titleId} className="font-display text-heading-card font-semibold text-ink-1">{kase.title}</h2>
          <p className="line-clamp-2 text-body-s text-ink-2">
            <span className="font-medium text-ink-1">{lt('complaint')}: </span>
            {kase.chiefComplaint}
          </p>
          <div className="mt-auto pt-1">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DifficultyMark difficulty={kase.difficulty} />
              <span className="inline-flex items-center gap-1 text-body-s text-ink-2">
                <Clock aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                {lt('minutes', { n: estimateMinutes(kase) })}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}
