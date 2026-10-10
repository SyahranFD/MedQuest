import type { CharacterGeometry } from './character-geometry'
import { FACE_TRIANGLES } from './face'
import { countTriangles } from './geom'

// Performance budget (PRD section 9) and helpers to check it without a GPU.

export const BUDGET = {
  /** Hero patient, close-up. */
  patientTriangles: 900,
  sceneTriangles: 6000,
  drawCalls: 25,
} as const

export function characterTriangles(g: CharacterGeometry): number {
  let total = FACE_TRIANGLES + countTriangles(g.upper) + countTriangles(g.head)
  if (g.lower) total += countTriangles(g.lower)
  if (g.legL) total += countTriangles(g.legL)
  if (g.legR) total += countTriangles(g.legR)
  return total
}

export interface BudgetReport {
  triangles: number
  drawCalls: number
  withinTriangles: boolean
  withinDrawCalls: boolean
}

export function checkBudget(triangles: number, drawCalls: number): BudgetReport {
  return {
    triangles,
    drawCalls,
    withinTriangles: triangles <= BUDGET.sceneTriangles,
    withinDrawCalls: drawCalls <= BUDGET.drawCalls,
  }
}

/** Draw calls for one character: upper, head, face, plus lower body (1) or two legs (walking). */
export function characterDrawCalls(walking: boolean, visibleFx: number): number {
  return 3 + (walking ? 2 : 1) + visibleFx
}
