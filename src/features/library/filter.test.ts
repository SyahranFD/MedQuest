import { describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { createDemoRecords } from '@/features/session/demo-history'
import { caseCategory, caseProgress, categoriesOf, emptyFilters, estimateMinutes, filterCases, isFiltering } from './filter'

const ids = (l: readonly { id: string }[]) => l.map((c) => c.id)

describe('filterCases', () => {
  it('returns everything with empty filters', () => {
    expect(filterCases(ALL_CASES, emptyFilters)).toHaveLength(6)
    expect(isFiltering(emptyFilters)).toBe(false)
  })
  it('filters by mode and difficulty', () => {
    expect(filterCases(ALL_CASES, { ...emptyFilters, mode: 'er' })).toHaveLength(3)
    expect(filterCases(ALL_CASES, { ...emptyFilters, mode: 'poli' }).every((c) => c.mode === 'poli')).toBe(true)
    expect(ids(filterCases(ALL_CASES, { ...emptyFilters, difficulty: 'sulit' }))).toEqual(['er-malaria-berat'])
  })
  it('filters by specialty category', () => {
    const cardio = filterCases(ALL_CASES, { ...emptyFilters, category: 'cardio' })
    expect(ids(cardio).sort()).toEqual(['er-acs-stemi', 'poli-hipertensi'])
    expect(cardio.every((c) => caseCategory(c) === 'cardio')).toBe(true)
  })
  it('searches title, complaint and specialty, ignoring case', () => {
    expect(filterCases(ALL_CASES, { ...emptyFilters, query: 'DEMAM' }).length).toBeGreaterThan(0)
    expect(ids(filterCases(ALL_CASES, { ...emptyFilters, query: 'kencing manis' }))).toEqual(['poli-dm2'])
    expect(filterCases(ALL_CASES, { ...emptyFilters, query: 'tidak ada kasus begini' })).toEqual([])
  })
  it('combines filters', () => {
    expect(ids(filterCases(ALL_CASES, { query: '', mode: 'er', category: 'infection', difficulty: 'sedang' }))).toEqual(['er-dengue-dss'])
    expect(isFiltering({ ...emptyFilters, query: ' x ' })).toBe(true)
  })
  it('lists only specialties that exist, in a stable order', () => {
    expect(categoriesOf(ALL_CASES)).toEqual(['infection', 'cardio', 'endocrine', 'pulmo'])
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
