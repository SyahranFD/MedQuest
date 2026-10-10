import { DIMENSIONS } from '@/features/cases/types'
import type { Dimension } from '@/features/cases/types'
import type { SessionRecord } from '@/features/session/repository'

export interface ProgressSummary {
  sessions: number
  cases: number
  averagePercent: number
  averageEmpathy: number
  /** Dimension with the lowest average score, or null when nothing was graded. */
  weakest: Dimension | null
}

/** Progress numbers for the home screen, from every saved evaluation. */
export function summarize(records: readonly SessionRecord[]): ProgressSummary {
  const evals = records.flatMap((r) => r.evaluations)
  if (evals.length === 0) return { sessions: records.length, cases: 0, averagePercent: 0, averageEmpathy: 0, weakest: null }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const perDimension = DIMENSIONS.map((d) => ({ d, avg: mean(evals.map((e) => e.dimensions[d].percent)) }))
  const weakest = perDimension.reduce((lo, cur) => (cur.avg < lo.avg ? cur : lo)).d
  return {
    sessions: records.length,
    cases: evals.length,
    averagePercent: Math.round(mean(evals.map((e) => e.percent))),
    averageEmpathy: Math.round(mean(evals.map((e) => e.empathyScore))),
    weakest,
  }
}
