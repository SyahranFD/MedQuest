// Library filtering and per-case status from history. Pure, so it is easy to test.

import type { BadgeCategory } from '@/components/ui/badge'
import type { Case, Difficulty, Mode } from '@/features/cases/types'
import { caseCategory } from '@/features/cases/card-meta'
import type { SessionRecord } from '@/features/session/repository'

export interface LibraryFilters {
  query: string
  mode: Mode | 'all'
  category: BadgeCategory | 'all'
  difficulty: Difficulty | 'all'
}

export const emptyFilters: LibraryFilters = { query: '', mode: 'all', category: 'all', difficulty: 'all' }

export { caseCategory, estimateMinutes } from '@/features/cases/card-meta'

/** Specialties actually present in the catalogue, in a stable order. */
export function categoriesOf(cases: readonly Case[]): BadgeCategory[] {
  const order: BadgeCategory[] = ['infection', 'cardio', 'endocrine', 'pulmo', 'neuro']
  const present = new Set(cases.map(caseCategory))
  return order.filter((c) => present.has(c))
}

const fold = (s: string) => s.toLocaleLowerCase('id').normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function filterCases(cases: readonly Case[], f: LibraryFilters): Case[] {
  const q = fold(f.query.trim())
  return cases.filter(
    (c) =>
      (f.mode === 'all' || c.mode === f.mode) &&
      (f.difficulty === 'all' || c.difficulty === f.difficulty) &&
      (f.category === 'all' || caseCategory(c) === f.category) &&
      (q === '' || fold(`${c.title} ${c.chiefComplaint} ${c.specialty}`).includes(q)),
  )
}

export function isFiltering(f: LibraryFilters) {
  return f.query.trim() !== '' || f.mode !== 'all' || f.category !== 'all' || f.difficulty !== 'all'
}

export interface CaseProgress {
  status: 'new' | 'completed'
  attempts: number
  /** Best score percent, or null when never played. */
  best: number | null
}

export function caseProgress(caseId: string, records: readonly SessionRecord[]): CaseProgress {
  const percents = records.flatMap((r) => r.evaluations.filter((e) => e.caseId === caseId).map((e) => e.percent))
  return percents.length
    ? { status: 'completed', attempts: percents.length, best: Math.max(...percents) }
    : { status: 'new', attempts: 0, best: null }
}
