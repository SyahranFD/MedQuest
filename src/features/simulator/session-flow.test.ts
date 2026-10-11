import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { caseCategory } from '@/features/cases/card-meta'
import { listCases, requireCase } from '@/features/cases/repository'
import { getSessionResult } from '@/features/session/repository'
import { useSessionStore } from '@/features/session/store'
import { DEFAULT_BED_COUNT } from '@/features/session/er-engine'
import { categoryOf } from './case-meta'
import { composeShift, finishSession, loadTraces, startCaseSession } from './session-flow'

const s = () => useSessionStore.getState()

describe('encounter through the store', () => {
  beforeEach(() => s().reset())

  it('plays a poli case from start to a saved, graded record with a trace', async () => {
    const c = requireCase('poli-hipertensi')
    await startCaseSession(c)
    const pid = s().activePatientId!
    const hello = s().typeMessage(pid, 'Selamat pagi, saya mengerti ini pasti tidak nyaman bagi Anda.')
    expect(hello.ok).toBe(true)
    expect(hello.tone).toBe('empatik')
    expect(hello.trustDelta).toBeGreaterThan(0)
    expect(s().askQuestion(pid, c.dialogue[0]!.id).ok).toBe(true)
    const tests = c.rubric.criteria.flatMap((cr) => (cr.met.kind === 'ordered' ? cr.met.anyOf.slice(0, 1) : []))
    tests.forEach((t) => s().orderTest(pid, t))
    expect(s().receiveResults(pid).length).toBe(tests.length)
    expect(s().diagnose(pid, c.correctDiagnosisId).correct).toBe(true)
    expect(s().treat(pid, c.indicatedTreatmentIds[0]!).ok).toBe(true)
    expect(s().dispose(pid, c.correctDispositionId).ok).toBe(true)

    const record = await finishSession()
    expect(record).not.toBeNull()
    expect(s().session!.status).toBe('ended')
    const saved = await getSessionResult(record!.id)
    expect(saved!.evaluations[0]!.caseId).toBe(c.id)
    expect(saved!.evaluations[0]!.percent).toBeGreaterThan(30)
    expect(loadTraces(record!.id)![c.id]!.length).toBeGreaterThan(1)
  })

  it('opens an ER shift with the chosen case first and fast-forwards to its arrival', async () => {
    const session = await startCaseSession(requireCase('er-malaria-berat'))
    expect(session.order[0]).toBe('er-malaria-berat')
    expect(session.order).toHaveLength(DEFAULT_BED_COUNT)
    expect(s().session!.patients['er-malaria-berat']!.status).toBe('waiting')
    expect(s().activePatientId).toBe('er-malaria-berat')
  })

  it('composes a stable shift: chosen case first, no duplicates, capped at the bed count, mixed specialties', async () => {
    const er = await listCases({ mode: 'er' })
    expect(er.length).toBeGreaterThan(DEFAULT_BED_COUNT)
    for (const c of er) {
      const shift = composeShift(c, er)
      expect(shift).toEqual(composeShift(c, [...er].reverse().sort((a, b) => a.id.localeCompare(b.id))))
      expect(shift[0]).toBe(c.id)
      expect(shift).toHaveLength(DEFAULT_BED_COUNT)
      expect(new Set(shift).size).toBe(shift.length)
      expect(shift.every((id) => er.some((x) => x.id === id))).toBe(true)
      const cats = new Set(shift.map((id) => categoryOf(er.find((x) => x.id === id)!)))
      expect(cats.size).toBeGreaterThan(1)
    }
  })

  it('gives every case the same specialty hue on the folder and in the simulator', () => {
    for (const c of ALL_CASES) expect(categoryOf(c), c.id).toBe(caseCategory(c))
  })
})
