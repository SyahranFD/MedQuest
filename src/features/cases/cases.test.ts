import { describe, expect, it } from 'vitest'
import { GUIDELINE_IDS } from '@/features/grading/guidelines'
import { caseCategory } from './card-meta'
import { ALL_CASES } from './data'
import { getCase, listCases, resolveTestResult } from './repository'
import type { Pred } from './types'
import { DIMENSIONS } from './types'

describe('case data integrity', () => {
  it('has only synthetic cases with unique ids and both modes', () => {
    expect(ALL_CASES.every((c) => c.synthetic === true)).toBe(true)
    expect(new Set(ALL_CASES.map((c) => c.id)).size).toBe(ALL_CASES.length)
    expect(ALL_CASES.filter((c) => c.mode === 'er').length).toBeGreaterThanOrEqual(3)
    expect(ALL_CASES.filter((c) => c.mode === 'poli').length).toBeGreaterThanOrEqual(9)
  })

  it('maps each added poli case to its intended specialty hue', () => {
    const expected: Record<string, string> = {
      'poli-tifoid': 'infection',
      'poli-isk': 'infection',
      'poli-asma': 'pulmo',
      'poli-pneumonia': 'pulmo',
      'poli-hipertensi-hamil': 'cardio',
      'poli-kusta': 'infection',
    }
    for (const [id, category] of Object.entries(expected)) {
      const c = ALL_CASES.find((x) => x.id === id)
      expect(c, id).toBeDefined()
      expect(caseCategory(c!), id).toBe(category)
    }
  })

  it('gives the added poli cases a full question bank, a trust gate, and mixed difficulty', () => {
    const added = ALL_CASES.filter((c) => ['poli-tifoid', 'poli-isk', 'poli-asma', 'poli-pneumonia', 'poli-hipertensi-hamil', 'poli-kusta'].includes(c.id))
    expect(added).toHaveLength(6)
    expect(new Set(added.map((c) => c.difficulty))).toEqual(new Set(['mudah', 'sedang', 'sulit']))
    for (const c of added) {
      expect(c.mode).toBe('poli')
      expect(c.dialogue.length, c.id).toBeGreaterThanOrEqual(22)
      expect(c.dialogue.some((d) => d.redFlag), c.id).toBe(true)
      expect(c.panels.every((p) => p.testIds.every((id) => c.tests.some((t) => t.testId === id))), c.id).toBe(true)
    }
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
    expect(await listCases()).toHaveLength(ALL_CASES.length)
    const erCases = await listCases({ mode: 'er' })
    expect(erCases.length).toBeGreaterThanOrEqual(3)
    expect(erCases.every((c) => c.mode === 'er')).toBe(true)
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

const ER_WAVE_TWO: Record<string, string> = {
  'er-stroke-iskemik': 'neuro',
  'er-sepsis-pneumonia': 'infection',
  'er-kad': 'endocrine',
  'er-ppok-eksaserbasi': 'pulmo',
  'er-ugib-varises': 'infection',
  'er-anafilaksis': 'pulmo',
}

describe('ER shift mechanics', () => {
  const erCases = ALL_CASES.filter((c) => c.mode === 'er')

  it('adds the second wave of ER cases with varied difficulty and the intended specialty hue', () => {
    const added = erCases.filter((c) => c.id in ER_WAVE_TWO)
    expect(added).toHaveLength(6)
    expect(new Set(added.map((c) => c.difficulty))).toEqual(new Set(['mudah', 'sedang', 'sulit']))
    for (const c of added) {
      expect(caseCategory(c), c.id).toBe(ER_WAVE_TWO[c.id])
      expect(c.dialogue.length, c.id).toBeGreaterThanOrEqual(22)
      expect(c.dialogue.filter((d) => d.redFlag).length, c.id).toBeGreaterThanOrEqual(2)
      expect(c.dialogue.filter((d) => d.minTrust !== undefined).length, c.id).toBeGreaterThanOrEqual(1)
      expect(c.exam.length, c.id).toBeGreaterThanOrEqual(8)
      expect(c.tests.length, c.id).toBeGreaterThanOrEqual(12)
    }
  })

  for (const c of erCases) {
    describe(c.id, () => {
      const er = c.er!
      const treatmentIds = c.treatments.map((t) => t.id)

      it('has a valid triage and strictly increasing stage timers', () => {
        expect(er.arrivalSec).toBeGreaterThanOrEqual(0)
        expect(er.triage.reason.length).toBeGreaterThan(20)
        expect(er.triage.zone === 'red' ? er.triage.esi <= 2 : er.triage.zone === 'yellow' ? er.triage.esi === 3 : er.triage.esi >= 4).toBe(true)
        const times = er.timeline.map((s) => s.atSec)
        expect(times).toEqual([...times].sort((a, b) => a - b))
        expect(new Set(times).size).toBe(3)
        expect(er.criticalDeadlineSec).toBeGreaterThan(0)
        expect(er.criticalDeadlineSec).toBeLessThan(times[2]!)
      })

      it('references only offered treatments in stages and effects', () => {
        for (const s of er.timeline) s.averted.forEach((id) => expect(treatmentIds, `stage ${s.stage} averted ${id}`).toContain(id))
        for (const e of er.effects) expect(treatmentIds, `effect ${e.treatmentId}`).toContain(e.treatmentId)
        for (const t of c.tests) {
          for (const r of t.results) r.afterTreatment?.forEach((id) => expect(treatmentIds, `${t.testId} afterTreatment ${id}`).toContain(id))
        }
        c.panels.forEach((p) => p.testIds.forEach((id) => expect(c.tests.map((t) => t.testId), `${p.id} ${id}`).toContain(id)))
      })

      it('makes every contraindicated treatment harmful and keeps critical treatments indicated', () => {
        const harmful = er.effects.filter((e) => e.harmful).map((e) => e.treatmentId)
        c.contraindicated.forEach((x) => expect(harmful, x.id).toContain(x.id))
        c.criticalTreatmentIds.forEach((id) => expect(c.indicatedTreatmentIds, id).toContain(id))
        c.criticalTreatmentIds.forEach((id) => expect(er.timeline.some((s) => s.averted.includes(id)), `${id} averts a stage`).toBe(true))
      })
    })
  }
})
