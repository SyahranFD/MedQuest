import { describe, expect, it } from 'vitest'
import { dimensionAverages, summarizeStudent } from './class-stats'
import { AS_OF, buildMockClass } from './mock-class'
import { recommendCase } from './recommendation'

describe('recommendCase', () => {
  const students = buildMockClass()
  const averages = dimensionAverages(students.flatMap((s) => s.attempts))
  const distinct = (s: (typeof students)[number]) => new Set(s.attempts.map((a) => a.caseId)).size

  it('targets the weakest dimension and prefers an unattempted case', () => {
    const s = students.find((x) => distinct(x) < 6 && x.attempts.length > 0)!
    const sum = summarizeStudent(s, AS_OF)
    const reco = recommendCase(sum, s.attempts, averages)!
    expect(reco.dimension).toBe(sum.weakestDimension)
    expect(s.attempts.some((a) => a.caseId === reco.caseId)).toBe(false)
    expect(reco.gap).toBe(Math.round(reco.score - averages[reco.dimension]))
  })

  it('falls back to the case with the lowest score on that dimension', () => {
    const s = students.find((x) => distinct(x) === 6)!
    const reco = recommendCase(summarizeStudent(s, AS_OF), s.attempts, averages)!
    const d = reco.dimension
    const per = (id: string) => {
      const l = s.attempts.filter((a) => a.caseId === id)
      return l.reduce((t, a) => t + a.evaluation.dimensions[d].percent, 0) / l.length
    }
    expect(per(reco.caseId)).toBe(Math.min(...[...new Set(s.attempts.map((a) => a.caseId))].map(per)))
  })

  it('returns null without attempts', () => {
    const empty = { ...students[0]!, attempts: [] }
    expect(recommendCase(summarizeStudent(empty, AS_OF), [], averages)).toBeNull()
  })
})
