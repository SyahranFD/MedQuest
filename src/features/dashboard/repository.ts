// Repository seam for the lecturer dashboard. Async so a backend can replace it; the mock adds a
// short latency outside tests so skeleton loaders are visible in the demo.

import {
  caseStats,
  classKpis,
  dimensionAverages,
  attentionPriority,
  mostMissedCriteria,
  summarizeStudent,
  weeklyTrend,
} from './class-stats'
import { AS_OF, buildMockClass, CLASS_META, WINDOW_START } from './mock-class'
import type { CaseStats, ClassOverview, MissedCriterion, StudentDetail, StudentSummary, WeeklyPoint } from './types'

const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 280

const settle = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS))

export async function listStudents(): Promise<StudentSummary[]> {
  await settle()
  return buildMockClass().map((s) => summarizeStudent(s, AS_OF))
}

/** Null (not undefined) for an unknown id: TanStack Query rejects undefined results. */
export async function getStudent(id: string): Promise<StudentDetail | null> {
  await settle()
  const student = buildMockClass().find((s) => s.id === id)
  return student ? { ...summarizeStudent(student, AS_OF), attempts: student.attempts } : null
}

export async function getClassOverview(): Promise<ClassOverview> {
  await settle()
  const students = buildMockClass()
  const summaries = students.map((s) => summarizeStudent(s, AS_OF))
  return {
    meta: CLASS_META,
    kpis: classKpis(students),
    dimensionAverages: dimensionAverages(students.flatMap((s) => s.attempts)),
    attention: summaries
      .filter((s) => s.status !== 'on-track')
      .sort((a, b) => attentionPriority(b) - attentionPriority(a))
      .slice(0, 6),
  }
}

export async function getCaseStats(): Promise<CaseStats[]> {
  await settle()
  return caseStats(buildMockClass())
}

export async function getMostMissedCriteria(limit = 6): Promise<MissedCriterion[]> {
  await settle()
  return mostMissedCriteria(buildMockClass(), limit)
}

export async function getWeeklyTrend(): Promise<WeeklyPoint[]> {
  await settle()
  return weeklyTrend(buildMockClass(), WINDOW_START)
}
