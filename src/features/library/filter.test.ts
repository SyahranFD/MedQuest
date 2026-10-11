import { describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { createDemoRecords } from '@/features/session/demo-history'
import { caseCategory, caseProgress, categoriesOf, emptyFilters, estimateMinutes, filterCases, isFiltering } from './filter'

const ids = (l: readonly { id: string }[]) => l.map((c) => c.id)
const idsWhere = (pred: (c: (typeof ALL_CASES)[number]) => boolean) => ids(ALL_CASES.filter(pred)).sort()

describe('filterCases', () => {
  it('returns everything with empty filters', () => {
    expect(filterCases(ALL_CASES, emptyFilters)).toHaveLength(ALL_CASES.length)
    expect(isFiltering(emptyFilters)).toBe(false)
  })
  it('filters by mode and difficulty', () => {
    expect(filterCases(ALL_CASES, { ...emptyFilters, mode: 'er' })).toHaveLength(ALL_CASES.filter((c) => c.mode === 'er').length)
    expect(filterCases(ALL_CASES, { ...emptyFilters, mode: 'poli' }).every((c) => c.mode === 'poli')).toBe(true)
    expect(ids(filterCases(ALL_CASES, { ...emptyFilters, difficulty: 'sulit' }))).toEqual(ids(ALL_CASES.filter((c) => c.difficulty === 'sulit')))
    expect(filterCases(ALL_CASES, { ...emptyFilters, difficulty: 'sulit' }).length).toBeGreaterThan(0)
  })
  it('filters by specialty category', () => {
    const cardio = filterCases(ALL_CASES, { ...emptyFilters, category: 'cardio' })
    expect(ids(cardio).sort()).toEqual(idsWhere((c) => caseCategory(c) === 'cardio'))
    expect(ids(cardio)).toEqual(expect.arrayContaining(['er-acs-stemi', 'poli-hipertensi']))
    expect(cardio.every((c) => caseCategory(c) === 'cardio')).toBe(true)
  })
  it('searches title, complaint and specialty, ignoring case', () => {
    expect(filterCases(ALL_CASES, { ...emptyFilters, query: 'DEMAM' }).length).toBeGreaterThan(0)
    expect(ids(filterCases(ALL_CASES, { ...emptyFilters, query: 'kencing manis' }))).toEqual(['poli-dm2'])
    expect(filterCases(ALL_CASES, { ...emptyFilters, query: 'tidak ada kasus begini' })).toEqual([])
  })
  it('combines filters', () => {
    const combined = filterCases(ALL_CASES, { query: '', mode: 'er', category: 'infection', difficulty: 'sedang' })
    expect(ids(combined)).toContain('er-dengue-dss')
    expect(combined.every((c) => c.mode === 'er' && c.difficulty === 'sedang' && caseCategory(c) === 'infection')).toBe(true)
    expect(isFiltering({ ...emptyFilters, query: ' x ' })).toBe(true)
  })
  it('lists only specialties that exist, in a stable order', () => {
    expect(categoriesOf(ALL_CASES)).toEqual(['infection', 'cardio', 'endocrine', 'pulmo', 'neuro'])
  })
})

describe('estimateMinutes and caseProgress', () => {
  it('ER is longer than poli and harder is longer', () => {
    expect(estimateMinutes({ mode: 'er', difficulty: 'sedang' })).toBeGreaterThan(estimateMinutes({ mode: 'poli', difficulty: 'sedang' }))
    expect(estimateMinutes({ mode: 'poli', difficulty: 'sulit' })).toBeGreaterThan(estimateMinutes({ mode: 'poli', difficulty: 'mudah' }))
  })
  it('marks a case completed from history and everything else new', () => {
    const records = createDemoRecords()
    expect(caseProgress('poli-hipertensi', records)).toMatchObject({ status: 'completed', attempts: 1 })
    expect(caseProgress('poli-hipertensi', records).best).toBe(records[0]!.evaluations[0]!.percent)
    expect(caseProgress('unknown', records)).toEqual({ status: 'new', attempts: 0, best: null })
    expect(caseProgress('poli-tb-paru', [])).toEqual({ status: 'new', attempts: 0, best: null })
  })
})
