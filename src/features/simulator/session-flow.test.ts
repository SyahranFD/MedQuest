import { beforeEach, describe, expect, it } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { getSessionResult } from '@/features/session/repository'
import { useSessionStore } from '@/features/session/store'
import { finishSession, loadTraces, startCaseSession } from './session-flow'

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
    expect(session.order).toHaveLength(3)
    expect(s().session!.patients['er-malaria-berat']!.status).toBe('waiting')
    expect(s().activePatientId).toBe('er-malaria-berat')
  })
})
