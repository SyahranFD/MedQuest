import { describe, expect, it } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { acsCase } from '@/features/cases/data/acs'
import { dengueCase } from '@/features/cases/data/dengue'
import { malariaCase } from '@/features/cases/data/malaria'
import { tbCase } from '@/features/cases/data/tb'
import { diabetesCase } from '@/features/cases/data/diabetes'
import {
  advanceTo,
  assignBed,
  createSession,
  dispose,
  giveTreatment,
  isShiftOver,
  listResults,
  markResultsSeen,
  orderTest,
  setTriage,
  shiftFailed,
} from './er-engine'
import type { Session } from './types'

const shift = (seed = 1) => createSession({ mode: 'er', cases: [acsCase, dengueCase, malariaCase], seed })

function seatFirst(seed = 1): Session {
  const r = assignBed(shift(seed), acsCase.id, 0)
  expect(r.result.ok).toBe(true)
  return r.session
}

describe('ER shift setup and queue', () => {
  it('starts with 3 beds, the first patient waiting and the others upcoming', () => {
    const s = shift()
    expect(s.beds).toEqual([null, null, null])
    expect(s.patients[acsCase.id].status).toBe('waiting')
    expect(s.patients[dengueCase.id].status).toBe('upcoming')
    expect(s.events[0]).toMatchObject({ kind: 'arrival', patientId: acsCase.id })
  })

  it('patients arrive on the scripted clock', () => {
    const { session, events } = advanceTo(shift(), 200, requireCase)
    expect(session.patients[dengueCase.id].status).toBe('waiting')
    expect(session.patients[malariaCase.id].status).toBe('waiting')
    expect(events.filter((e) => e.kind === 'arrival').map((e) => e.patientId)).toEqual([dengueCase.id, malariaCase.id])
    expect(events[0].atSec).toBe(90)
  })

  it('assigns beds with validation', () => {
    const s = shift()
    expect(assignBed(s, dengueCase.id, 0).result.error).toBe('not-waiting')
    expect(assignBed(s, acsCase.id, 5).result.error).toBe('invalid-bed')
    const seated = assignBed(s, acsCase.id, 1).session
    expect(seated.beds).toEqual([null, acsCase.id, null])
    expect(seated.patients[acsCase.id]).toMatchObject({ status: 'in-bed', bedIndex: 1, bedAtSec: 0 })
    const later = advanceTo(seated, 100, requireCase).session
    expect(assignBed(later, dengueCase.id, 1).result.error).toBe('bed-occupied')
    expect(assignBed(later, dengueCase.id, 2).result.ok).toBe(true)
  })

  it('triage is loose: it records the zone and never blocks bedding', () => {
    const s = shift()
    const wrong = setTriage(s, acsCase.id, 'green', requireCase)
    expect(wrong.result).toMatchObject({ ok: true, correct: false })
    expect(wrong.result.text).toContain('Nyeri dada')
    expect(setTriage(wrong.session, acsCase.id, 'red', requireCase).result.error).toBe('already-triaged')
    expect(assignBed(wrong.session, acsCase.id, 0).result.ok).toBe(true)
    expect(setTriage(s, acsCase.id, 'red', requireCase).result.correct).toBe(true)
  })
})

describe('timed results', () => {
  it('arrive after the (jittered) turnaround of simulated time', () => {
    let s = seatFirst()
    const o = orderTest(s, acsCase.id, 'troponin', requireCase)
    s = o.session
    expect(o.result).toMatchObject({ ok: true, ready: false })
    expect(o.result.readyAtSec).toBeGreaterThanOrEqual(54)
    expect(o.result.readyAtSec).toBeLessThanOrEqual(66)
    const early = advanceTo(s, 40, requireCase)
    expect(early.events.some((e) => e.kind === 'result-ready')).toBe(false)
    expect(listResults(early.session, acsCase.id, requireCase)[0].ready).toBe(false)
    const late = advanceTo(early.session, 80, requireCase)
    const ev = late.events.find((e) => e.kind === 'result-ready')
    expect(ev).toMatchObject({ testId: 'troponin', critical: true, level: 'critical' })
    const view = listResults(late.session, acsCase.id, requireCase)[0]
    expect(view).toMatchObject({ ready: true, seen: false, abnormal: true })
    expect(view.text).toContain('Troponin')
    const seen = markResultsSeen(late.session, acsCase.id).session
    expect(listResults(seen, acsCase.id, requireCase)[0].seen).toBe(true)
  })

  it('works with an accelerated clock: same events, fewer real seconds', () => {
    const base = orderTest(seatFirst(), acsCase.id, 'ekg', requireCase).session
    const fast = advanceTo({ ...base, speed: 4 }, 4 * 5, requireCase)
    expect(fast.session.nowSec).toBe(20)
    expect(fast.events.some((e) => e.kind === 'result-ready' && e.testId === 'ekg')).toBe(true)
  })

  it('rejects duplicates, unknown tests, and ordering before a bed', () => {
    expect(orderTest(shift(), acsCase.id, 'ekg', requireCase).result.error).toBe('not-in-bed')
    const s = seatFirst()
    const once = orderTest(s, acsCase.id, 'ekg', requireCase).session
    expect(orderTest(once, acsCase.id, 'ekg', requireCase).result.error).toBe('already-ordered')
    expect(orderTest(s, acsCase.id, 'nope', requireCase).result.error).toBe('unknown-test')
  })

  it('picks the result variant for the current stage', () => {
    const d = assignBed(advanceTo(shift(), 95, requireCase).session, dengueCase.id, 0)
    const s = orderTest(d.session, dengueCase.id, 'laktat', requireCase).session
    const stage2 = advanceTo(s, 95 + 400, requireCase).session
    const text = listResults(stage2, dengueCase.id, requireCase)[0].text
    expect(text).toContain('5,6')
  })
})

describe('deterioration', () => {
  it('advances through scripted stages and ends in death when untreated', () => {
    let s = seatFirst()
    const stages: number[] = []
    for (let t = 20; t <= 600; t += 20) {
      s = advanceTo(s, t, requireCase).session
      stages.push(s.patients[acsCase.id].stage)
    }
    expect(stages[Math.floor(140 / 20) - 1]).toBe(0)
    expect(stages[Math.floor(160 / 20) - 1]).toBe(1)
    expect(stages[Math.floor(340 / 20) - 1]).toBe(2)
    const p = s.patients[acsCase.id]
    expect(p.status).toBe('deceased')
    expect(p.log.outcome).toBe('deceased')
    expect(p.log.stageTrail.map((x) => x.stage)).toEqual([0, 1, 2, 3])
    expect(s.beds).toEqual([null, null, null])
    expect(s.events.filter((e) => e.kind === 'death')).toHaveLength(1)
    expect(shiftFailed(s)).toBe(true)
    expect(p.vitals.sbp).toBeLessThan(acsCase.vitals.sbp)
  })

  it('moves at half speed while the patient waits for a bed', () => {
    const waiting = advanceTo(shift(), 320, requireCase).session
    expect(waiting.patients[acsCase.id].stage).toBe(1)
    expect(waiting.patients[acsCase.id].exposureSec).toBeCloseTo(160)
    const bedded = advanceTo(seatFirst(), 100, requireCase).session
    expect(bedded.patients[acsCase.id].exposureSec).toBeCloseTo(100)
  })

  it('an indicated treatment averts the stage it covers', () => {
    let s = seatFirst()
    s = advanceTo(s, 10, requireCase).session
    s = giveTreatment(s, acsCase.id, 'aspirin-load', requireCase).session
    const out = advanceTo(s, 200, requireCase)
    expect(out.session.patients[acsCase.id].stage).toBe(0)
    expect(out.events.some((e) => e.kind === 'stage-averted')).toBe(true)
    expect(out.session.patients[acsCase.id].log.treatments[0]).toMatchObject({ id: 'aspirin-load', atSec: 10 })
  })

  it('a treatment that improves steps the patient back and re-arms later stages', () => {
    let s = assignBed(advanceTo(shift(), 90, requireCase).session, dengueCase.id, 0).session
    s = advanceTo(s, 90 + 160, requireCase).session
    expect(s.patients[dengueCase.id].stage).toBe(1)
    const sbpAtStage1 = s.patients[dengueCase.id].vitals.sbp
    s = giveTreatment(s, dengueCase.id, 'kristaloid-bolus', requireCase).session
    const p = s.patients[dengueCase.id]
    expect(p.stage).toBe(0)
    expect(p.vitals.sbp).toBeGreaterThan(sbpAtStage1)
    s = advanceTo(s, 90 + 900, requireCase).session
    expect(s.patients[dengueCase.id].stage).toBe(0)
    expect(s.patients[dengueCase.id].status).toBe('in-bed')
  })

  it('a harmful treatment pushes the next stage immediately', () => {
    let s = seatFirst()
    s = giveTreatment(s, acsCase.id, 'ketorolak', requireCase).session
    s = advanceTo(s, 2, requireCase).session
    expect(s.patients[acsCase.id].stage).toBe(1)
  })

  it('disposition ends the exposure and frees the bed', () => {
    let s = seatFirst()
    s = advanceTo(s, 60, requireCase).session
    const out = dispose(s, acsCase.id, 'cathlab', requireCase)
    expect(out.result.ok).toBe(true)
    const p = out.session.patients[acsCase.id]
    expect(p).toMatchObject({ status: 'transferred' })
    expect(p.log).toMatchObject({ dispositionId: 'cathlab', outcome: 'transferred' })
    expect(out.session.beds[0]).toBeNull()
    const later = advanceTo(out.session, 900, requireCase).session
    expect(later.patients[acsCase.id].stage).toBe(0)
    expect(dispose(later, acsCase.id, 'cathlab', requireCase).result.error).toBe('not-in-bed')
    expect(dispose(s, acsCase.id, 'nope', requireCase).result.error).toBe('unknown-disposition')
  })

  it('shift is over when every patient is resolved', () => {
    let s = createSession({ mode: 'er', cases: [acsCase, dengueCase], seed: 3 })
    s = assignBed(s, acsCase.id, 0).session
    s = advanceTo(s, 100, requireCase).session
    s = assignBed(s, dengueCase.id, 1).session
    expect(isShiftOver(s)).toBe(false)
    s = dispose(s, acsCase.id, 'cathlab', requireCase).session
    s = dispose(s, dengueCase.id, 'rawat-icu', requireCase).session
    expect(isShiftOver(s)).toBe(true)
    expect(shiftFailed(s)).toBe(false)
  })
})

describe('determinism', () => {
  const run = (seed: number) => {
    let s = createSession({ mode: 'er', cases: [acsCase, dengueCase, malariaCase], seed })
    s = assignBed(s, acsCase.id, 0).session
    for (const t of ['ekg', 'troponin', 'ck-mb', 'foto-toraks', 'ekokardiografi', 'dpl']) {
      s = orderTest(s, acsCase.id, t, requireCase).session
    }
    s = advanceTo(s, 70, requireCase).session
    s = giveTreatment(s, acsCase.id, 'aspirin-load', requireCase).session
    s = advanceTo(s, 400, requireCase).session
    return s
  }

  it('same seed and operations give identical sessions', () => {
    expect(run(7)).toEqual(run(7))
  })

  it('splitting time into different step sizes gives the same outcome', () => {
    const a = advanceTo(seatFirst(), 300, requireCase).session
    let b = seatFirst()
    for (let t = 10; t <= 300; t += 10) b = advanceTo(b, t, requireCase).session
    expect(b.patients[acsCase.id].stage).toBe(a.patients[acsCase.id].stage)
    expect(b.patients[acsCase.id].vitals).toEqual(a.patients[acsCase.id].vitals)
  })

  it('a different seed jitters turnaround times', () => {
    const ready = (seed: number) => run(seed).patients[acsCase.id].log.orders.map((o) => o.readyAtSec)
    expect(ready(1)).not.toEqual(ready(2))
  })
})

describe('poli sessions', () => {
  it('seat the first patient immediately and return results instantly', () => {
    const s = createSession({ mode: 'poli', cases: [tbCase, diabetesCase], seed: 1 })
    expect(s.patients[tbCase.id]).toMatchObject({ status: 'in-bed', bedIndex: 0 })
    expect(s.patients[diabetesCase.id].status).toBe('waiting')
    const o = orderTest(s, tbCase.id, 'genexpert', requireCase)
    expect(o.result).toMatchObject({ ok: true, ready: true, abnormal: true })
    expect(o.result.text).toContain('terdeteksi')
  })

  it('raises a time-up event at the soft limit and seats the next patient after disposition', () => {
    let s = createSession({ mode: 'poli', cases: [tbCase, diabetesCase], seed: 1 })
    const out = advanceTo(s, 481, requireCase)
    expect(out.events.filter((e) => e.kind === 'time-up')).toHaveLength(1)
    s = dispose(out.session, tbCase.id, 'pulang-kontrol', requireCase).session
    expect(s.patients[diabetesCase.id]).toMatchObject({ status: 'in-bed', bedIndex: 0 })
    expect(s.patients[diabetesCase.id].bedAtSec).toBe(481)
  })
})
