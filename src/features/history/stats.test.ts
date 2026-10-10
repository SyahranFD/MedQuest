import { describe, expect, it } from 'vitest'
import { DIMENSIONS } from '@/features/cases/types'
import { createDemoRecords } from '@/features/session/demo-history'
import { defaultFilters, filterRows, personalStats, toRows } from './stats'

const records = createDemoRecords()
const rows = toRows(records)

describe('toRows', () => {
  it('flattens one row per graded case with unique keys', () => {
    expect(rows).toHaveLength(records.flatMap((r) => r.evaluations).length)
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
    expect(rows.every((r) => r.demo)).toBe(true)
  })
})

describe('filterRows', () => {
  it('sorts newest first by default and honours the other orders', () => {
    const newest = filterRows(rows, defaultFilters).map((r) => r.savedAt)
    expect(newest).toEqual([...newest].sort((a, b) => b.localeCompare(a)))
    const high = filterRows(rows, { ...defaultFilters, sort: 'high' }).map((r) => r.evaluation.percent)
    expect(high).toEqual([...high].sort((a, b) => b - a))
    const low = filterRows(rows, { ...defaultFilters, sort: 'low' }).map((r) => r.evaluation.percent)
    expect(low).toEqual([...low].sort((a, b) => a - b))
  })
  it('filters by mode, case and rating', () => {
    expect(filterRows(rows, { ...defaultFilters, mode: 'poli' }).every((r) => r.mode === 'poli')).toBe(true)
    expect(filterRows(rows, { ...defaultFilters, caseId: 'poli-dm2' })).toHaveLength(1)
    const passed = filterRows(rows, { ...defaultFilters, rating: 'passed' })
    const retry = filterRows(rows, { ...defaultFilters, rating: 'retry' })
    expect(passed.length + retry.length).toBe(rows.length)
    expect(retry.every((r) => ['borderline', 'clear-fail'].includes(r.evaluation.band))).toBe(true)
  })
  it('does not mutate its input', () => {
    const before = rows.map((r) => r.key)
    filterRows(rows, { ...defaultFilters, sort: 'oldest' })
    expect(rows.map((r) => r.key)).toEqual(before)
  })
})

describe('personalStats', () => {
  it('averages dimensions from the graded evaluations', () => {
    const stats = personalStats(records)
    const evals = records.flatMap((r) => r.evaluations)
    expect(stats.sessions).toBe(records.length)
    expect(stats.cases).toBe(evals.length)
    expect(stats.bestPercent).toBe(Math.max(...evals.map((e) => e.percent)))
    for (const d of DIMENSIONS) {
      expect(stats.dimensions![d]).toBeCloseTo(evals.reduce((s, e) => s + e.dimensions[d].percent, 0) / evals.length, 10)
    }
  })
  it('handles an empty history', () => {
    expect(personalStats([])).toEqual({ sessions: 0, cases: 0, averagePercent: null, bestPercent: null, averageEmpathy: null, dimensions: null })
  })
})
