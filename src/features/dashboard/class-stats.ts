// Pure derivations over the mock class. Everything here reads grader output, nothing is invented.

import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import type { Band, Dimension } from '@/features/cases/types'
import { citationFor } from '@/features/grading/guidelines'
import { WEEK_COUNT } from './mock-class'
import type {
  AttentionReason,
  CaseStats,
  ClassAttempt,
  ClassKpis,
  ClassStudent,
  MissedCriterion,
  StudentSummary,
  WeeklyPoint,
} from './types'

export const INACTIVE_DAYS = 14
export const LOW_SCORE_PERCENT = 60
export const PASS_PERCENT = 60
const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

const mean = (values: readonly number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0)
const round = (n: number) => Math.round(n)

const allAttempts = (students: readonly ClassStudent[]) => students.flatMap((s) => s.attempts)

export function dimensionAverages(attempts: readonly ClassAttempt[]): Record<Dimension, number> {
  const out = {} as Record<Dimension, number>
  for (const d of DIMENSIONS) out[d] = mean(attempts.map((a) => a.evaluation.dimensions[d].percent))
  return out
}

export function summarizeStudent(student: ClassStudent, asOf: number): StudentSummary {
  const { attempts } = student
  const casesCompleted = new Set(attempts.map((a) => a.caseId)).size
  const last = attempts[attempts.length - 1]
  const daysSinceActive = last ? Math.floor((asOf - Date.parse(last.at)) / DAY_MS) : null
  const averagePercent = attempts.length ? mean(attempts.map((a) => a.evaluation.percent)) : null
  const recent = attempts.slice(-3)
  const recentPercent = recent.length ? mean(recent.map((a) => a.evaluation.percent)) : null
  const dims = attempts.length ? dimensionAverages(attempts) : null
  const weakest = dims ? DIMENSIONS.reduce((w, d) => (dims[d] < dims[w] ? d : w), DIMENSIONS[0]!) : null

  const reasons: AttentionReason[] = []
  if (daysSinceActive === null || daysSinceActive >= INACTIVE_DAYS) reasons.push('inactive')
  if (averagePercent !== null && (averagePercent < LOW_SCORE_PERCENT || (recentPercent ?? 100) < LOW_SCORE_PERCENT - 5)) {
    reasons.push('low-score')
  }
  if (attempts.length >= 5 && averagePercent !== null && recentPercent !== null && recentPercent <= averagePercent - 12) {
    reasons.push('declining')
  }
  const status = reasons.includes('inactive') ? 'inactive' : reasons.length ? 'attention' : 'on-track'

  return {
    id: student.id,
    name: student.name,
    initials: student.initials,
    nim: student.nim,
    attemptCount: attempts.length,
    casesCompleted,
    casesTotal: ALL_CASES.length,
    progress: round((casesCompleted / ALL_CASES.length) * 100),
    averagePercent: averagePercent === null ? null : round(averagePercent),
    recentPercent: recentPercent === null ? null : round(recentPercent),
    averageEmpathy: attempts.length ? round(mean(attempts.map((a) => a.evaluation.empathyScore))) : null,
    lastActiveAt: last?.at ?? null,
    daysSinceActive,
    dimensionAverages: dims,
    weakestDimension: weakest,
    status,
    reasons,
  }
}

/** Higher is more urgent: inactive first, then the lowest averages. */
export function attentionPriority(s: StudentSummary): number {
  return (s.status === 'inactive' ? 30 : 0) + (100 - (s.averagePercent ?? 0)) + s.reasons.length * 5
}

export function classKpis(students: readonly ClassStudent[]): ClassKpis {
  const attempts = allAttempts(students)
  const inWeek = (a: ClassAttempt, w: number) => a.week === w
  const active = (w: number) => new Set(attempts.filter((a) => inWeek(a, w)).map((a) => a.studentId)).size
  const weekAvg = (w: number) => {
    const list = attempts.filter((a) => inWeek(a, w))
    return list.length ? mean(list.map((a) => a.evaluation.percent)) : 0
  }
  const completedPairs = students.reduce((s, st) => s + new Set(st.attempts.map((a) => a.caseId)).size, 0)
  const possiblePairs = students.length * ALL_CASES.length
  return {
    activeThisWeek: active(WEEK_COUNT),
    activePreviousWeek: active(WEEK_COUNT - 1),
    enrolled: students.length,
    averagePercent: round(mean(attempts.map((a) => a.evaluation.percent))),
    averagePreviousWeek: round(weekAvg(WEEK_COUNT - 1)),
    completionRate: round((completedPairs / possiblePairs) * 100),
    completedPairs,
    possiblePairs,
    averageEmpathy: round(mean(attempts.map((a) => a.evaluation.empathyScore))),
  }
}

export function caseStats(students: readonly ClassStudent[]): CaseStats[] {
  const attempts = allAttempts(students)
  const rows = ALL_CASES.map((c) => {
    const list = attempts.filter((a) => a.caseId === c.id)
    const bands = { 'clear-fail': 0, borderline: 0, pass: 0, good: 0, excellent: 0 } as Record<Band, number>
    for (const a of list) bands[a.evaluation.band]++
    const passing = list.filter((a) => a.evaluation.percent >= PASS_PERCENT && a.evaluation.band !== 'borderline' && a.evaluation.band !== 'clear-fail')
    return {
      caseId: c.id,
      title: c.title,
      mode: c.mode,
      difficulty: c.difficulty,
      attempts: list.length,
      studentsAttempted: new Set(list.map((a) => a.studentId)).size,
      averagePercent: round(mean(list.map((a) => a.evaluation.percent))),
      passRate: list.length ? round((passing.length / list.length) * 100) : 0,
      averageEmpathy: round(mean(list.map((a) => a.evaluation.empathyScore))),
      bands,
      hardestRank: 0,
    }
  })
  const order = rows.slice().sort((a, b) => a.averagePercent - b.averagePercent)
  return rows.map((r) => ({ ...r, hardestRank: order.findIndex((o) => o.caseId === r.caseId) + 1 }))
}

export function mostMissedCriteria(students: readonly ClassStudent[], limit = 6): MissedCriterion[] {
  const attempts = allAttempts(students)
  const rows: MissedCriterion[] = []
  for (const c of ALL_CASES) {
    const list = attempts.filter((a) => a.caseId === c.id)
    if (list.length < 5) continue
    for (const crit of c.rubric.criteria) {
      const results = list.map((a) => a.evaluation.criteria.find((r) => r.id === crit.id))
      const missed = results.filter((r) => r && r.verdict !== 'met').length
      const cite = crit.guidelineRef ? citationFor(crit.guidelineRef) : undefined
      rows.push({
        criterionId: crit.id,
        caseId: c.id,
        caseTitle: c.title,
        dimension: crit.dimension,
        label: crit.label,
        missRate: round((missed / list.length) * 100),
        attempts: list.length,
        ...(cite ? { cite } : {}),
      })
    }
  }
  return rows.sort((a, b) => b.missRate - a.missRate || a.criterionId.localeCompare(b.criterionId)).slice(0, limit)
}

export function weeklyTrend(students: readonly ClassStudent[], windowStart: number): WeeklyPoint[] {
  const attempts = allAttempts(students)
  return Array.from({ length: WEEK_COUNT }, (_, i) => {
    const week = i + 1
    const list = attempts.filter((a) => a.week === week)
    return {
      week,
      startsAt: new Date(windowStart + i * WEEK_MS).toISOString(),
      attempts: list.length,
      activeStudents: new Set(list.map((a) => a.studentId)).size,
      averagePercent: list.length ? round(mean(list.map((a) => a.evaluation.percent))) : null,
      averageEmpathy: list.length ? round(mean(list.map((a) => a.evaluation.empathyScore))) : null,
    }
  })
}
