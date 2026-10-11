import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import type { BadgeCategory } from '@/components/ui/badge'
import { useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { caseCategory, CATEGORY_ICONS, MODE_ICONS } from '../card-meta'
import type { Case } from '../types'
import { useCt } from '../use-ct'
import { PatientAvatar } from './patient-avatar'

const TAB: Record<BadgeCategory, string> = {
  infection: 'bg-(--mq-folder-tab-infection)',
  cardio: 'bg-(--mq-folder-tab-cardio)',
  endocrine: 'bg-(--mq-folder-tab-endocrine)',
  pulmo: 'bg-(--mq-folder-tab-pulmo)',
  neuro: 'bg-(--mq-folder-tab-neuro)',
}

const LIFT = 'group-hover/folder:-translate-y-4 group-focus-visible/folder:-translate-y-4'

/** One case as a manila folder: kraft body, specialty-colored tab, a patient ID card that rises on hover or focus. */
export function CaseFolder({ kase }: { kase: Case }) {
  const ct = useCt()
  const titleId = useId()
  const reduced = useReducedMotion()
  const category = caseCategory(kase)
  const CategoryIcon = CATEGORY_ICONS[category]
  const ModeIcon = MODE_ICONS[kase.mode]
  const { patient } = kase
  return (
    <li className="min-w-0">
      <Link
        to="/app/kasus/$caseId"
        params={{ caseId: kase.id }}
        aria-labelledby={titleId}
        data-testid="case-folder"
        data-category={category}
        className="group/folder block rounded-card text-ink-1"
      >
        <span className="relative mt-2 block h-59">
          <span aria-hidden="true" className={cn('absolute top-0 left-0 block h-6.5 w-[44%] rounded-t-sm', TAB[category])} />
          <span aria-hidden="true" className="absolute inset-x-0 top-4.5 bottom-0 block rounded-b-card rounded-tr-card bg-(--mq-folder-back)" />
          <span
            data-testid="case-folder-paper"
            className={cn(
              'absolute inset-x-3 top-7.5 flex h-27.5 -rotate-1 items-start gap-2.5 rounded-row border border-line-strong bg-(--mq-folder-paper) p-2.5',
              !reduced && 'transition-[translate] duration-200 ease-[cubic-bezier(.2,.8,.2,1)]',
              !reduced && LIFT,
            )}
          >
            <span className="block h-19.5 w-16 flex-none overflow-hidden rounded-xs border border-line-strong bg-(--mq-folder-back)">
              <PatientAvatar patient={patient} seed={kase.id} />
            </span>
            <span className="flex min-w-0 flex-col">
              <strong className="truncate text-body-s font-semibold text-ink-1">{patient.name}</strong>
              <span className="text-meta text-ink-3">
                {patient.age} · {ct(`gender.${patient.gender}`)}
              </span>
              <span className="truncate text-meta text-ink-3">{patient.occupation}</span>
            </span>
          </span>
          <span className="absolute inset-x-0 bottom-0 block h-32 rounded-tl-xs rounded-b-card rounded-tr-card bg-(--mq-folder-front) px-4 py-3.5">
            <span id={titleId} data-testid="case-folder-title" className="mb-1 line-clamp-2 block text-[15px] leading-5 font-semibold text-ink-1">
              {kase.title}
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-body-s text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <CategoryIcon aria-hidden="true" className="size-3.5 flex-none" strokeWidth={1.75} />
                {ct(`category.${category}`)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ModeIcon aria-hidden="true" className="size-3.5 flex-none" strokeWidth={1.75} />
                {ct(`mode.${kase.mode}`)}
              </span>
            </span>
          </span>
        </span>
      </Link>
    </li>
  )
}

/** Responsive grid of folders; used by the library and the home mode groups. */
export function CaseFolderGrid({ cases, label }: { cases: readonly Case[]; label?: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cases.map((c) => (
        <CaseFolder key={c.id} kase={c} />
      ))}
    </ul>
  )
}

/** Same grid with card-shaped pulsing placeholders. */
export function CaseFolderSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="mq-skeleton mt-2 block h-59" />
      ))}
    </div>
  )
}
