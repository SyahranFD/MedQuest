// Picks the case a lecturer should assign next, from the student's weakest dimension.

import { ALL_CASES } from '@/features/cases/data'
import type { Dimension } from '@/features/cases/types'
import type { ClassAttempt, StudentSummary } from './types'

export interface Recommendation {
  caseId: string
  dimension: Dimension
  /** Student score minus class average on that dimension (negative means below). */
  gap: number
  score: number
}

/** First an unattempted case, otherwise the case where the student scored lowest on the weak dimension. */
export function recommendCase(summary: StudentSummary, attempts: readonly ClassAttempt[], classAverages: Record<Dimension, number>): Recommendation | null {
  const dimension = summary.weakestDimension
  if (!dimension || !summary.dimensionAverages) return null
  const score = Math.round(summary.dimensionAverages[dimension])
  const gap = Math.round(score - classAverages[dimension])
  const tried = new Set(attempts.map((a) => a.caseId))
  const fresh = ALL_CASES.find((c) => !tried.has(c.id))
  if (fresh) return { caseId: fresh.id, dimension, gap, score }
  const perCase = ALL_CASES.flatMap((c) => {
    const list = attempts.filter((a) => a.caseId === c.id)
    if (!list.length) return []
    return [{ id: c.id, avg: list.reduce((s, a) => s + a.evaluation.dimensions[dimension].percent, 0) / list.length }]
  })
  const worst = perCase.reduce((w, c) => (c.avg < w.avg ? c : w))
  return { caseId: worst.id, dimension, gap, score }
}
