// Flattening, filtering and personal statistics over saved sessions. Pure.

import { DIMENSIONS } from '@/features/cases/types'
import type { Band, Dimension, Evaluation, Mode } from '@/features/cases/types'
import type { SessionRecord } from '@/features/session/repository'

export interface HistoryRow {
  /** Unique per record and case, stable for React keys. */
  key: string
  recordId: string
  savedAt: string
  mode: Mode
  durationSec: number
  demo: boolean
  evaluation: Evaluation
}

export type RatingFilter = 'all' | 'passed' | 'retry'
export type HistorySort = 'newest' | 'oldest' | 'high' | 'low'

export interface HistoryFilters {
  mode: Mode | 'all'
  rating: RatingFilter
  caseId: string
  /** Case-title search, case and accent insensitive. */
  query: string
  sort: HistorySort
}

export const defaultFilters: HistoryFilters = { mode: 'all', rating: 'all', caseId: 'all', query: '', sort: 'newest' }

export const PASSING_BANDS: readonly Band[] = ['pass', 'good', 'excellent']

export function toRows(records: readonly SessionRecord[]): HistoryRow[] {
  return records.flatMap((r) =>
    r.evaluations.map((evaluation, i) => ({
      key: `${r.id}:${evaluation.caseId}:${i}`,
      recordId: r.id,
      savedAt: r.savedAt,
      mode: r.mode,
      durationSec: r.durationSec,
      demo: r.demo === true,
      evaluation,
    })),
  )
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function filterRows(rows: readonly HistoryRow[], f: HistoryFilters): HistoryRow[] {
  const q = fold(f.query.trim())
  const kept = rows.filter(
    (r) =>
      (f.mode === 'all' || r.mode === f.mode) &&
      (f.caseId === 'all' || r.evaluation.caseId === f.caseId) &&
      (q === '' || fold(r.evaluation.caseTitle).includes(q)) &&
      (f.rating === 'all' || PASSING_BANDS.includes(r.evaluation.band) === (f.rating === 'passed')),
  )
  const by = {
    newest: (a: HistoryRow, b: HistoryRow) => b.savedAt.localeCompare(a.savedAt),
    oldest: (a: HistoryRow, b: HistoryRow) => a.savedAt.localeCompare(b.savedAt),
    high: (a: HistoryRow, b: HistoryRow) => b.evaluation.percent - a.evaluation.percent,
    low: (a: HistoryRow, b: HistoryRow) => a.evaluation.percent - b.evaluation.percent,
  }[f.sort]
  return kept.sort((a, b) => by(a, b) || a.key.localeCompare(b.key))
}

export interface PersonalStats {
  sessions: number
  cases: number
  averagePercent: number | null
  bestPercent: number | null
  averageEmpathy: number | null
  dimensions: Record<Dimension, number> | null
}

const mean = (list: readonly number[]) => list.reduce((s, n) => s + n, 0) / list.length

export function personalStats(records: readonly SessionRecord[]): PersonalStats {
  const evals = records.flatMap((r) => r.evaluations)
  if (evals.length === 0) {
    return { sessions: records.length, cases: 0, averagePercent: null, bestPercent: null, averageEmpathy: null, dimensions: null }
  }
  const dimensions = {} as Record<Dimension, number>
  for (const d of DIMENSIONS) dimensions[d] = mean(evals.map((e) => e.dimensions[d].percent))
  return {
    sessions: records.length,
    cases: evals.length,
    averagePercent: Math.round(mean(evals.map((e) => e.percent))),
    bestPercent: Math.max(...evals.map((e) => e.percent)),
    averageEmpathy: Math.round(mean(evals.map((e) => e.empathyScore))),
    dimensions,
  }
}
