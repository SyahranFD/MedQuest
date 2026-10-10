import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { tbCase } from '@/features/cases/data/tb'
import { acsCase } from '@/features/cases/data/acs'
import type { Case } from '@/features/cases/types'
import { buildScriptedLog } from '@/features/grading/scripted-logs'
import { listSessionResults } from '@/features/session/repository'
import { selectScenePatients, selectShiftFailed, selectShiftOver, selectVisual, useSessionStore } from './store'

const store = () => useSessionStore.getState()

beforeEach(() => {
  store().reset()
})

/** Start a one-case session and seat the patient. */
function begin(c: Case) {
  store().startSession({ mode: c.mode, caseIds: [c.id], seed: 5 })
  if (c.mode === 'er') {
    store().tick((c.er?.arrivalSec ?? 0) + 1)
    store().triage(c.id, c.er!.triage.zone)
    expect(store().assignBed(c.id, 0).ok).toBe(true)
  }
  return c.id
}

/** Replay a scripted log through the real engine, ticking 4 simulated seconds between actions. */
function replay(c: Case, kind: 'perfect' | 'average') {
  const id = begin(c)
  const log = buildScriptedLog(c, kind)
  const step = () => store().tick(4)
  for (const m of log.chat.filter((x) => x.who === 'you' && ((x.intents?.length ?? 0) > 0 || (x.tone && x.tone !== 'netral')))) {
    const r = store().typeMessage(id, m.text, { interrupted: false })
    expect(r.ok).toBe(true)
    step()
  }
  for (const a of log.askedIds) {
    const r = store().askQuestion(id, a.id, { interrupted: false })
    expect(r.withheld, `${a.id} withheld at trust ${r.trust}`).toBe(false)
    step()
  }
  for (const e of log.exams) {
    expect(store().examine(id, e.id).ok).toBe(true)
    step()
  }
  for (const o of log.orders) {
    expect(store().orderTest(id, o.testId).ok).toBe(true)
    step()
  }
  for (const t of log.treatments) {
    expect(store().treat(id, t.id, { dose: t.dose, duration: t.duration }).ok).toBe(true)
    step()
  }
  if (log.diagnosisId) expect(store().diagnose(id, log.diagnosisId).ok).toBe(true)
  if (log.dispositionId) expect(store().dispose(id, log.dispositionId).ok).toBe(true)
  return id
}

describe('session store: complete runs through the real engine', () => {
  for (const c of ALL_CASES) {
    it(`${c.id}: a perfect run is graded excellent`, async () => {
      replay(c, 'perfect')
      const record = await store().endSession()
      const ev = store().evaluations![0]
      expect(ev.band, JSON.stringify(ev.criteria.filter((x) => x.verdict !== 'met').map((x) => [x.id, x.evidence]))).toBe('excellent')
      expect(ev.breaches).toHaveLength(0)
      expect(record?.evaluations).toHaveLength(1)
      expect(store().session?.status).toBe('ended')
    })

    it(`${c.id}: a bad run is a clear fail`, async () => {
      const id = begin(c)
      store().typeMessage(id, 'Salah sendiri, makanya jangan bandel.')
      store().typeMessage(id, 'Ah masa, jangan banyak alasan.')
      expect(store().session?.patients[id].emotion.trust).toBeLessThan(c.initialTrust - 15)
      store().treat(id, c.contraindicated[0].id)
      store().diagnose(id, c.diagnoses.find((d) => d.id !== c.correctDiagnosisId)!.id)
      if (c.mode === 'er') store().tick(700)
      else store().dispose(id, c.dispositions.find((d) => d.id !== c.correctDispositionId)!.id)
      await store().endSession()
      const ev = store().evaluations![0]
      expect(ev.band).toBe('clear-fail')
      expect(ev.breaches.length).toBeGreaterThan(0)
      if (c.mode === 'er') {
        expect(store().session?.patients[id].status).toBe('deceased')
        expect(selectShiftFailed(store())).toBe(true)
      }
    })
  }
})

describe('session store actions', () => {
  it('rejects actions without an active session', () => {
    expect(store().askQuestion('x', 'y')).toMatchObject({ ok: false, error: 'no-active-session' })
    expect(store().tick(5)).toEqual([])
  })

  it('answers typed Indonesian text and exposes trust, mood and a visual', () => {
    const id = begin(tbCase)
    const r = store().typeMessage(id, 'Selamat pagi pak, perkenalkan saya dokter muda. Sejak kapan batuknya ya?')
    expect(r).toMatchObject({ ok: true, entryId: 'onset', tone: 'empatik' })
    expect(r.reply).toContain('minggu')
    expect(r.trustDelta).toBeGreaterThan(0)
    expect(r.speakMs).toBeGreaterThan(0)
    const v = selectVisual(store(), id, true)
    expect(v).toMatchObject({ seed: tbCase.id, talking: true, pose: 'sitting', gender: 'M' })
    expect(selectScenePatients(store(), id)[0]).toMatchObject({ id, visual: { talking: true } })
  })

  it('treats a question asked while the patient is still talking as an interruption', () => {
    const id = begin(tbCase)
    const first = store().askQuestion(id, 'onset')
    expect(first.tone).toBe('netral')
    const second = store().askQuestion(id, 'dahak')
    expect(second.tone).toBe('menyela')
    expect(second.trustDelta).toBeLessThan(0)
    expect(second.reply).toContain(tbCase.fallbacks.interruptedReply)
    store().tick(10)
    expect(store().askQuestion(id, 'demam-sore').tone).toBe('netral')
  })

  it('withholds a gated answer at low trust and gives it once trust is built', () => {
    const id = begin(acsCase)
    expect(store().askQuestion(id, 'obat-kuat', { interrupted: false })).toMatchObject({ withheld: true })
    expect(store().session?.patients[id].log.askedIds.some((a) => a.id === 'obat-kuat')).toBe(false)
    const calm = { interrupted: false }
    store().typeMessage(id, 'Selamat pagi pak, perkenalkan saya dokter muda.', calm)
    store().typeMessage(id, 'Saya mengerti ini pasti tidak nyaman, kami akan bantu.', calm)
    store().typeMessage(id, 'Izin ya pak, apa yang paling bapak khawatirkan?', calm)
    const r = store().askQuestion(id, 'obat-kuat', { interrupted: false })
    expect(r.withheld).toBe(false)
    expect(r.reply).toContain('Viagra')
  })

  it('a clarification fallback is logged and costs patience', () => {
    const id = begin(tbCase)
    const before = store().session!.patients[id].emotion.patience
    const r = store().typeMessage(id, 'qwerty asdf zxcv')
    expect(r.unclear).toBe(true)
    expect(store().session!.patients[id].emotion.patience).toBeLessThan(before)
  })

  it('locks the diagnosis after the first pick and reports right or wrong', () => {
    const id = begin(tbCase)
    const wrong = store().diagnose(id, 'pneumonia')
    expect(wrong).toMatchObject({ ok: true, correct: false })
    expect(store().diagnose(id, tbCase.correctDiagnosisId).error).toBe('diagnosis-locked')
  })

  it('poli results are instant; ER results arrive on tick and receiveResults marks them seen', () => {
    const poli = begin(tbCase)
    expect(store().orderTest(poli, 'genexpert')).toMatchObject({ ready: true, abnormal: true })
    expect(store().receiveResults(poli).map((r) => r.testId)).toEqual(['genexpert'])
    store().reset()
    const er = begin(acsCase)
    expect(store().orderTest(er, 'ekg')).toMatchObject({ ok: true, ready: false })
    expect(store().receiveResults(er)).toEqual([])
    const events = store().tick(25)
    expect(events.some((e) => e.kind === 'result-ready' && e.testId === 'ekg')).toBe(true)
    expect(store().feed.some((e) => e.kind === 'result-ready')).toBe(true)
    const ready = store().receiveResults(er)
    expect(ready[0]).toMatchObject({ testId: 'ekg', abnormal: true, critical: true, imageId: 'ecg-stemi-anterior' })
    expect(store().session!.patients[er].log.orders[0].seenAtSec).toBeDefined()
  })

  it('tick respects the speed multiplier and ends the shift when all patients are resolved', () => {
    const id = begin(acsCase)
    store().setSpeed(2)
    store().tick(10)
    expect(store().session!.nowSec).toBeCloseTo(acsCase.er!.arrivalSec + 1 + 20)
    expect(selectShiftOver(store())).toBe(false)
    store().dispose(id, 'cathlab')
    expect(selectShiftOver(store())).toBe(true)
  })

  it('labels a worsening ER patient with a status key and calms a deceased one in the scene', () => {
    const id = begin(acsCase)
    expect(selectScenePatients(store())[0]!.statusLabel).toBeUndefined()
    store().setSpeed(4)
    for (let i = 0; i < 400 && store().session!.patients[id]!.status !== 'deceased'; i++) store().tick(10)
    const p = store().session!.patients[id]!
    expect(p.status).toBe('deceased')
    expect(selectScenePatients(store(), id)[0]).toMatchObject({ statusLabel: 'meninggal', visual: { emotion: 'netral', talking: false } })
  })

  it('endSession saves the record so the history picks it up', async () => {
    replay(tbCase, 'perfect')
    const before = (await listSessionResults()).length
    const record = await store().endSession()
    const after = await listSessionResults()
    expect(after.length).toBe(before + 1)
    expect(after[0].id).toBe(record?.id)
    expect(store().lastRecordId).toBe(record?.id)
    expect(await store().endSession()).toBeNull()
  })
})
