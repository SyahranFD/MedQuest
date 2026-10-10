// Repository seam: async functions so a backend can replace them without touching callers.

import { ALL_CASES } from './data'
import type { Case, Mode, TestResultVariant } from './types'

export interface CaseFilter {
  mode?: Mode
}

export async function listCases(filter: CaseFilter = {}): Promise<Case[]> {
  return ALL_CASES.filter((c) => !filter.mode || c.mode === filter.mode).slice()
}

export async function getCase(id: string): Promise<Case | undefined> {
  return ALL_CASES.find((c) => c.id === id)
}

/** Synchronous lookup for pure engines; throws on an unknown id. */
export function requireCase(id: string): Case {
  const c = ALL_CASES.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown case id: ${id}`)
  return c
}

/** Pick the result variant for the patient's current stage and given treatments. */
export function resolveTestResult(
  c: Case,
  testId: string,
  ctx: { stage: number; treatmentIds: readonly string[] },
): TestResultVariant | undefined {
  const test = c.tests.find((t) => t.testId === testId)
  if (!test) return undefined
  return test.results.find((r) => {
    if (r.minStage !== undefined && ctx.stage < r.minStage) return false
    if (r.afterTreatment && !r.afterTreatment.some((id) => ctx.treatmentIds.includes(id))) return false
    return true
  })
}
