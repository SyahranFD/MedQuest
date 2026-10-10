import { describe, expect, it } from 'vitest'
import { GUIDELINE_IDS } from '@/features/grading/guidelines'
import { ALL_CASES } from './data'
import { getCase, listCases, resolveTestResult } from './repository'
import type { Pred } from './types'
import { DIMENSIONS } from './types'

describe('case data integrity', () => {
  it('has the six required cases, all synthetic, 3 ER and 3 poli', () => {
    expect(ALL_CASES).toHaveLength(6)
    expect(ALL_CASES.every((c) => c.synthetic === true)).toBe(true)
    expect(ALL_CASES.filter((c) => c.mode === 'er')).toHaveLength(3)
    expect(ALL_CASES.filter((c) => c.mode === 'poli')).toHaveLength(3)
    expect(new Set(ALL_CASES.map((c) => c.id)).size).toBe(6)
  })

  for (const c of ALL_CASES) {
    describe(c.id, () => {
      it('references only known ids in rubric predicates', () => {
        const dialogue = c.dialogue.map((d) => d.id)
        const exams = c.exam.map((e) => e.id)
        const tests = c.tests.map((t) => t.testId)
        const treatments = c.treatments.map((t) => t.id)
        const walk = (cr: string, p: Pred) => {
          if (p.kind === 'asked') p.anyOf.forEach((id) => expect(dialogue, `${cr} asked ${id}`).toContain(id))
          if (p.kind === 'examined') p.anyOf.forEach((id) => expect(exams, `${cr} exam ${id}`).toContain(id))
          if (p.kind === 'ordered' || p.kind === 'seenResult') p.anyOf.forEach((id) => expect(tests, `${cr} test ${id}`).toContain(id))
          if (p.kind === 'orderedBefore') [p.first, p.then].forEach((id) => expect(tests).toContain(id))
          if (p.kind === 'treated' && Array.isArray(p.anyOf)) p.anyOf.forEach((id) => expect(treatments, `${cr} treat ${id}`).toContain(id))
          if (p.kind === 'all' || p.kind === 'any') p.of.forEach((x) => walk(cr, x))
          if (p.kind === 'not') walk(cr, p.of)
        }
        for (const cr of c.rubric.criteria) {
          walk(cr.id, cr.met)
          if (cr.partial) walk(cr.id, cr.partial)
        }
        for (const b of c.rubric.breaches) walk(b.id, b.when)
      })

      it('cites only registry guidelines', () => {
        const refs = [
          ...c.guidelineIds,
          ...c.rubric.criteria.flatMap((cr) => (cr.guidelineRef ? [cr.guidelineRef] : [])),
          ...c.rubric.breaches.flatMap((b) => (b.guidelineRef ? [b.guidelineRef] : [])),
        ]
        expect(refs.length).toBeGreaterThan(0)
        for (const r of refs) expect(GUIDELINE_IDS).toContain(r)
      })

      it('covers all six dimensions and cites the heavy therapy criteria', () => {
        for (const d of DIMENSIONS) expect(c.rubric.criteria.some((cr) => cr.dimension === d)).toBe(true)
        const therapy = c.rubric.criteria.filter((cr) => cr.dimension === 'terapi' && cr.weight === 3)
        for (const cr of therapy) expect(cr.guidelineRef, cr.id).toBeTruthy()
      })

      it('has consistent diagnoses, treatments and dispositions', () => {
        expect(c.diagnoses).toHaveLength(5)
        expect(c.diagnoses.map((d) => d.id)).toContain(c.correctDiagnosisId)
        c.differentialIds.forEach((id) => expect(c.diagnoses.map((d) => d.id)).toContain(id))
        const tIds = c.treatments.map((t) => t.id)
        ;[...c.indicatedTreatmentIds, ...c.criticalTreatmentIds, ...c.contraindicated.map((x) => x.id)].forEach((id) =>
          expect(tIds).toContain(id),
        )
        expect(c.contraindicated.length).toBeGreaterThan(0)
        const dIds = c.dispositions.map((d) => d.id)
        expect(dIds).toContain(c.correctDispositionId)
        c.acceptableDispositionIds.forEach((id) => expect(dIds).toContain(id))
      })

      it('uses unique dialogue ids and covers the required categories', () => {
        const ids = c.dialogue.map((d) => d.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const cat of ['rps', 'rpd', 'keluarga', 'alergi', 'obat', 'sosial'] as const) {
          expect(c.dialogue.some((d) => d.category === cat), cat).toBe(true)
        }
        expect(c.dialogue.some((d) => d.minTrust !== undefined)).toBe(true)
        expect(c.dialogue.some((d) => !d.relevant)).toBe(true)
      })

      it('has realistic turnaround: 15 to 90 s in ER, instant in poli', () => {
        for (const t of c.tests) {
          if (c.mode === 'er') {
            expect(t.turnaroundSec).toBeGreaterThanOrEqual(15)
            expect(t.turnaroundSec).toBeLessThanOrEqual(90)
          } else {
            expect(t.turnaroundSec).toBe(0)
          }
          expect(t.results[t.results.length - 1].minStage).toBeUndefined()
          expect(t.results[t.results.length - 1].afterTreatment).toBeUndefined()
        }
      })

      it('has a deterioration script only for ER cases', () => {
        if (c.mode === 'er') {
          expect(c.er?.timeline.map((s) => s.stage)).toEqual([1, 2, 3])
          expect(c.severity).toBe('critical')
        } else {
          expect(c.er).toBeUndefined()
        }
      })
    })
  }

  it('lists, filters and resolves through the repository', async () => {
    expect(await listCases()).toHaveLength(6)
    expect((await listCases({ mode: 'er' })).map((c) => c.mode)).toEqual(['er', 'er', 'er'])
    expect(await getCase('nope')).toBeUndefined()
    const dengue = (await getCase('er-dengue-dss'))!
    const before = resolveTestResult(dengue, 'dpl', { stage: 0, treatmentIds: [] })
    const after = resolveTestResult(dengue, 'dpl', { stage: 0, treatmentIds: ['kristaloid-bolus'] })
    expect(before?.text).toContain('47%')
    expect(after?.text).toContain('36%')
    const lactate = (stage: number) => resolveTestResult(dengue, 'laktat', { stage, treatmentIds: [] })?.text
    expect(lactate(2)).toContain('5,6')
    expect(lactate(0)).toContain('3,4')
  })
})
