import { describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import { caseStats, classKpis, dimensionAverages, mostMissedCriteria, summarizeStudent, weeklyTrend } from './class-stats'
import { AS_OF, buildMockClass, generateMockClass, WEEK_COUNT, WINDOW_START } from './mock-class'
import { getClassOverview, getStudent, listStudents } from './repository'

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

describe('mock class', () => {
  const students = buildMockClass()
  const attempts = students.flatMap((s) => s.attempts)

  it('is deterministic: two fresh builds are identical', () => {
    expect(generateMockClass()).toEqual(generateMockClass())
  })

  it('has 36 students with unique invented names, ids and student numbers', () => {
    expect(students).toHaveLength(36)
    expect(new Set(students.map((s) => s.name)).size).toBe(36)
    expect(new Set(students.map((s) => s.id)).size).toBe(36)
    expect(new Set(students.map((s) => s.nim)).size).toBe(36)
  })

  it('spreads attempts over 10 weeks, never in the future, oldest first', () => {
    expect(attempts.length).toBeGreaterThan(150)
    for (const s of students) {
      const times = s.attempts.map((a) => Date.parse(a.at))
      expect(times).toEqual([...times].sort((a, b) => a - b))
      for (const a of s.attempts) {
        expect(a.week).toBeGreaterThanOrEqual(1)
        expect(a.week).toBeLessThanOrEqual(WEEK_COUNT)
        expect(Date.parse(a.at)).toBeGreaterThanOrEqual(WINDOW_START)
        expect(Date.parse(a.at)).toBeLessThanOrEqual(AS_OF)
      }
    }
    expect(new Set(attempts.map((a) => a.week)).size).toBe(WEEK_COUNT)
  })

  it('covers all six cases and every percent is the grader weighted score', () => {
    expect(new Set(attempts.map((a) => a.caseId))).toEqual(new Set(ALL_CASES.map((c) => c.id)))
    for (const a of attempts.slice(0, 60)) {
      const kase = ALL_CASES.find((c) => c.id === a.caseId)!
      const weight = (id: string) => kase.rubric.criteria.find((c) => c.id === id)!.weight
      const total = a.evaluation.criteria.reduce((s, c) => s + weight(c.id), 0)
      const got = a.evaluation.criteria.reduce(
        (s, c) => s + weight(c.id) * (c.verdict === 'met' ? 1 : c.verdict === 'partially-met' ? 0.5 : 0),
        0,
      )
      expect(a.evaluation.percent).toBe(Math.round((got / total) * 100))
    }
  })

  it('class dimension averages equal a recomputation from grader outputs', () => {
    const avg = dimensionAverages(attempts)
    for (const d of DIMENSIONS) {
      expect(avg[d]).toBeCloseTo(mean(attempts.map((a) => a.evaluation.dimensions[d].percent)), 10)
    }
  })

  it('student summaries are consistent with their attempts', () => {
    for (const s of students) {
      const sum = summarizeStudent(s, AS_OF)
      expect(sum.attemptCount).toBe(s.attempts.length)
      expect(sum.casesCompleted).toBe(new Set(s.attempts.map((a) => a.caseId)).size)
      if (s.attempts.length) {
        expect(sum.averagePercent).toBe(Math.round(mean(s.attempts.map((a) => a.evaluation.percent))))
        for (const d of DIMENSIONS) {
          expect(sum.dimensionAverages![d]).toBeCloseTo(mean(s.attempts.map((a) => a.evaluation.dimensions[d].percent)), 10)
        }
        expect(sum.dimensionAverages![sum.weakestDimension!]).toBe(Math.min(...DIMENSIONS.map((d) => sum.dimensionAverages![d])))
      } else {
        expect(sum.status).toBe('inactive')
      }
    }
  })

  it('has a mix of statuses so the attention list is meaningful', () => {
    const statuses = new Set(students.map((s) => summarizeStudent(s, AS_OF).status))
    expect(statuses).toEqual(new Set(['on-track', 'attention', 'inactive']))
  })

  it('case stats, kpis and weekly trend agree with the raw attempts', () => {
    const stats = caseStats(students)
    expect(stats.reduce((s, c) => s + c.attempts, 0)).toBe(attempts.length)
    expect(stats.map((c) => c.hardestRank).sort()).toEqual([1, 2, 3, 4, 5, 6])
    const hardest = stats.find((c) => c.hardestRank === 1)!
    expect(hardest.averagePercent).toBe(Math.min(...stats.map((c) => c.averagePercent)))
    const kpis = classKpis(students)
    expect(kpis.averagePercent).toBe(Math.round(mean(attempts.map((a) => a.evaluation.percent))))
    expect(kpis.activeThisWeek).toBe(new Set(attempts.filter((a) => a.week === WEEK_COUNT).map((a) => a.studentId)).size)
    const trend = weeklyTrend(students, WINDOW_START)
    expect(trend).toHaveLength(WEEK_COUNT)
    expect(trend.reduce((s, w) => s + w.attempts, 0)).toBe(attempts.length)
  })

  it('most missed criteria are sorted and the top rate matches the raw verdicts', () => {
    const missed = mostMissedCriteria(students, 8)
    expect(missed).toHaveLength(8)
    expect(missed.map((m) => m.missRate)).toEqual([...missed.map((m) => m.missRate)].sort((a, b) => b - a))
    const top = missed[0]!
    const list = attempts.filter((a) => a.caseId === top.caseId)
    const missedCount = list.filter((a) => a.evaluation.criteria.find((c) => c.id === top.criterionId)!.verdict !== 'met').length
    expect(top.missRate).toBe(Math.round((missedCount / list.length) * 100))
  })
})

describe('dashboard repository', () => {
  it('returns promises over the same data', async () => {
    const list = await listStudents()
    expect(list).toHaveLength(36)
    expect((await getClassOverview()).meta.studentCount).toBe(36)
    expect((await getStudent('s01'))?.attempts.length).toBe(list[0]!.attemptCount)
    expect(await getStudent('nope')).toBeNull()
  })
})
