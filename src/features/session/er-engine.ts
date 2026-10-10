// ER script engine: beds, triage queue, timed results, scripted deterioration, dispositions.
// Pure and deterministic: all randomness is a hash of (session seed, patient, test); time only
// moves through advanceTo(). Poli sessions reuse the same functions with no deterioration and
// instant results.

import { clamp } from '@/lib/emotion'
import type { Case, DeteriorationStage, Vitals, Zone } from '@/features/cases/types'
import { resolveTestResult } from '@/features/cases/repository'
import { hashString } from '@/features/dialogue/normalize'
import { applyAction, basePain, createEmotionState, tick } from './emotion-engine'
import { createLog, formatClock, pushEvents, setPatient, traceEmotion } from './helpers'
import type { ActionResult, CaseLookup, Session, SessionEvent, SessionPatient } from './types'
import { RESOLVED_STATUSES } from './types'

export const DEFAULT_BED_COUNT = 3
export const POLI_CONSULT_LIMIT_SEC = 480
const TRACE_INTERVAL_SEC = 15

export interface CreateSessionOptions {
  mode: 'er' | 'poli'
  cases: Case[]
  seed?: number
  id?: string
  speed?: number
  bedCount?: number
}

function vitalsPlus(v: Vitals, d: Partial<Vitals>, sign = 1): Vitals {
  const out = { ...v }
  for (const k of Object.keys(d) as (keyof Vitals)[]) out[k] = (out[k] ?? 0) + sign * (d[k] ?? 0)
  out.spo2 = clamp(out.spo2, 0, 100)
  out.gcs = clamp(out.gcs, 3, 15)
  out.hr = Math.max(0, out.hr)
  out.sbp = Math.max(0, out.sbp)
  out.dbp = Math.max(0, out.dbp)
  return out
}

function mulberry(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function newPatient(c: Case, id: string, mode: 'er' | 'poli', status: SessionPatient['status'], arrivalSec: number): SessionPatient {
  return {
    id,
    caseId: c.id,
    seed: c.id,
    status,
    bedIndex: null,
    arrivalSec,
    bedAtSec: null,
    stage: 0,
    timelineIdx: 0,
    exposureSec: 0,
    vitals: { ...c.vitals },
    emotion: createEmotionState(c),
    log: createLog(c.id, arrivalSec),
    speakingUntilSec: 0,
    painRelief: 0,
    improvedBy: [],
    timeUpNotified: mode === 'er',
  }
}

export function createSession(opts: CreateSessionOptions): Session {
  const { mode, cases } = opts
  const bedCount = mode === 'er' ? (opts.bedCount ?? DEFAULT_BED_COUNT) : 1
  const patients: Record<string, SessionPatient> = {}
  const order: string[] = []
  const events: SessionEvent[] = []

  cases.forEach((c, i) => {
    const id = patients[c.id] ? `${c.id}#${i}` : c.id
    const arrivalSec = mode === 'er' ? (c.er?.arrivalSec ?? 0) : 0
    const status = arrivalSec <= 0 ? 'waiting' : 'upcoming'
    patients[id] = newPatient(c, id, mode, status, arrivalSec)
    order.push(id)
    if (status === 'waiting') {
      events.push({ id: events.length, kind: 'arrival', atSec: 0, patientId: id, label: `${c.patient.name} tiba`, level: 'info' })
    }
  })

  let session: Session = {
    id: opts.id ?? `ses-${opts.seed ?? 1}-${mode}`,
    mode,
    seed: opts.seed ?? 1,
    nowSec: 0,
    speed: opts.speed ?? 1,
    beds: Array.from({ length: bedCount }, () => null),
    patients,
    order,
    events,
    status: 'active',
    consultLimitSec: mode === 'poli' ? POLI_CONSULT_LIMIT_SEC : 0,
  }

  if (mode === 'poli') {
    const first = order.find((id) => patients[id].status === 'waiting')
    if (first) session = seatPatient(session, first, 0, 0)
  }
  return session
}

function seatPatient(session: Session, patientId: string, bedIndex: number, atSec: number): Session {
  const p = session.patients[patientId]
  const beds = session.beds.slice()
  beds[bedIndex] = patientId
  const seated: SessionPatient = {
    ...p,
    status: 'in-bed',
    bedIndex,
    bedAtSec: atSec,
    log: { ...p.log, bedAtSec: atSec, startedAtSec: session.mode === 'poli' ? atSec : p.log.startedAtSec },
    ...(session.mode === 'poli' ? { arrivalSec: atSec } : {}),
  }
  return setPatient({ ...session, beds }, seated)
}

// ---------- time ----------

function fireStages(p: SessionPatient, c: Case, t: number, events: Omit<SessionEvent, 'id'>[]): SessionPatient {
  const timeline = c.er?.timeline
  if (!timeline) return p
  let cur = p
  // guard against runaway loops if several stages are due in one step
  for (let guard = 0; guard < 4; guard++) {
    const entry: DeteriorationStage | undefined = timeline[cur.timelineIdx]
    if (!entry || cur.exposureSec < entry.atSec) break
    const averted = entry.averted.some((id) => cur.log.treatments.some((tr) => tr.id === id))
    if (averted) {
      cur = { ...cur, timelineIdx: cur.timelineIdx + 1 }
      events.push({
        kind: 'stage-averted',
        atSec: t,
        patientId: cur.id,
        label: `${c.patient.name} tetap stabil berkat terapi`,
        level: 'info',
        stage: entry.stage,
      })
      continue
    }
    cur = {
      ...cur,
      stage: entry.stage,
      timelineIdx: cur.timelineIdx + 1,
      vitals: vitalsPlus(cur.vitals, entry.vitalsDelta),
      log: { ...cur.log, stageTrail: [...cur.log.stageTrail, { atSec: t, stage: entry.stage }] },
    }
    if (entry.stage === 3) {
      cur = {
        ...cur,
        status: 'deceased',
        log: { ...cur.log, outcome: 'deceased', endedAtSec: t },
      }
      events.push({ kind: 'death', atSec: t, patientId: cur.id, label: `${c.patient.name}: ${entry.line}`, level: 'critical', stage: 3 })
      break
    }
    events.push({
      kind: 'stage',
      atSec: t,
      patientId: cur.id,
      label: `${c.patient.name}: ${entry.line}`,
      level: entry.stage === 2 ? 'critical' : 'warning',
      stage: entry.stage,
    })
  }
  return cur
}

/** Advance simulated time to targetSec in 1-second steps. Returns the new session and the events produced. */
export function advanceTo(
  session: Session,
  targetSec: number,
  lookup: CaseLookup,
): { session: Session; events: SessionEvent[] } {
  if (session.status === 'ended' || targetSec <= session.nowSec) return { session, events: [] }
  let s = session
  const produced: Omit<SessionEvent, 'id'>[] = []
  let now = session.nowSec
  let patients = s.patients
  let beds = s.beds

  while (now < targetSec) {
    const step = Math.min(1, targetSec - now)
    const t = now + step
    const next: Record<string, SessionPatient> = {}
    for (const id of s.order) {
      let p = patients[id]
      const c = lookup(p.caseId)
      if (p.status === 'upcoming' && p.arrivalSec <= t) {
        p = { ...p, status: 'waiting' }
        produced.push({ kind: 'arrival', atSec: t, patientId: id, label: `${c.patient.name} tiba`, level: 'info' })
      }
      if (p.status === 'waiting' || p.status === 'in-bed') {
        // deterioration exposure: full speed in a bed, half speed while waiting
        if (c.er) {
          p = { ...p, exposureSec: p.exposureSec + step * (p.status === 'in-bed' ? 1 : 0.5) }
          const before = p.status
          p = fireStages(p, c, t, produced)
          if (before !== p.status && p.status === 'deceased' && p.bedIndex !== null) {
            beds = beds.map((b) => (b === id ? null : b))
          }
        }
        // results arriving
        for (const o of p.log.orders) {
          if (o.readyAtSec > now && o.readyAtSec <= t && session.mode === 'er') {
            const v = resolveTestResult(c, o.testId, {
              stage: p.stage,
              treatmentIds: p.log.treatments.map((x) => x.id),
            })
            const test = c.tests.find((x) => x.testId === o.testId)
            produced.push({
              kind: 'result-ready',
              atSec: o.readyAtSec,
              patientId: id,
              label: `Hasil tersedia: ${test?.name ?? o.testId}`,
              level: v?.critical ? 'critical' : v?.abnormal ? 'warning' : 'info',
              testId: o.testId,
              abnormal: v?.abnormal,
              critical: v?.critical,
            })
          }
        }
        if (p.status !== 'deceased') {
          const stagePain = c.er ? 0.1 * p.stage : 0
          const painTarget = clamp((basePain(c.severity) + stagePain) * (1 - p.painRelief), 0, 1)
          p = { ...p, emotion: tick(p.emotion, step, { severity: c.severity, waiting: p.status === 'waiting', painTarget }) }
        }
        if (Math.floor(t / TRACE_INTERVAL_SEC) !== Math.floor(now / TRACE_INTERVAL_SEC)) {
          p = traceEmotion(p, t, 0)
        }
        if (s.consultLimitSec > 0 && !p.timeUpNotified && p.status === 'in-bed' && t - (p.bedAtSec ?? 0) >= s.consultLimitSec) {
          p = { ...p, timeUpNotified: true }
          produced.push({ kind: 'time-up', atSec: t, patientId: id, label: 'Waktu konsultasi habis', level: 'warning' })
        }
      }
      next[id] = p
    }
    patients = next
    now = t
  }

  s = { ...s, patients, beds, nowSec: targetSec }
  const out = pushEvents(s, produced.sort((a, b) => a.atSec - b.atSec))
  return out
}

// ---------- triage and beds ----------

function fail(session: Session, patientId: string, error: string): { session: Session; result: ActionResult } {
  return { session, result: { ok: false, error, patientId, atSec: session.nowSec } }
}

/**
 * Record the zone the student chose for a waiting or seated patient. Triage is loose on purpose:
 * it never blocks bed assignment, and a critical patient with calm vitals is still red.
 */
export function setTriage(session: Session, patientId: string, zone: Zone, lookup: CaseLookup) {
  const p = session.patients[patientId]
  if (!p || (p.status !== 'waiting' && p.status !== 'in-bed')) return fail(session, patientId, 'not-triageable')
  if (p.log.triage) return fail(session, patientId, 'already-triaged')
  const c = lookup(p.caseId)
  const updated = { ...p, log: { ...p.log, triage: { zone, atSec: session.nowSec } } }
  return {
    session: setPatient(session, updated),
    result: {
      ok: true,
      patientId,
      atSec: session.nowSec,
      correct: c.er ? c.er.triage.zone === zone : undefined,
      text: c.er?.triage.reason,
    } satisfies ActionResult,
  }
}

export function assignBed(session: Session, patientId: string, bedIndex: number) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  if (p.status !== 'waiting') return fail(session, patientId, 'not-waiting')
  if (bedIndex < 0 || bedIndex >= session.beds.length) return fail(session, patientId, 'invalid-bed')
  if (session.beds[bedIndex] !== null) return fail(session, patientId, 'bed-occupied')
  const seated = seatPatient(session, patientId, bedIndex, session.nowSec)
  return { session: seated, result: { ok: true, patientId, atSec: session.nowSec } satisfies ActionResult }
}

// ---------- tests ----------

export function testReadyAt(session: Session, patientId: string, testId: string, baseSec: number) {
  if (session.mode === 'poli' || baseSec <= 0) return session.nowSec
  const rand = mulberry(hashString(`${session.seed}:${patientId}:${testId}`))()
  return session.nowSec + Math.max(1, Math.round(baseSec * (0.9 + 0.2 * rand)))
}

export function orderTest(session: Session, patientId: string, testId: string, lookup: CaseLookup) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  if (p.status !== 'in-bed') return fail(session, patientId, 'not-in-bed')
  const c = lookup(p.caseId)
  const test = c.tests.find((x) => x.testId === testId)
  if (!test) return fail(session, patientId, 'unknown-test')
  if (p.log.orders.some((o) => o.testId === testId)) return fail(session, patientId, 'already-ordered')
  const readyAtSec = testReadyAt(session, patientId, testId, test.turnaroundSec)
  const updated: SessionPatient = {
    ...p,
    log: { ...p.log, orders: [...p.log.orders, { testId, atSec: session.nowSec, readyAtSec }] },
  }
  const ready = readyAtSec <= session.nowSec
  const result: ActionResult = { ok: true, patientId, atSec: session.nowSec, ready, readyAtSec }
  if (ready) {
    const v = resolveTestResult(c, testId, { stage: p.stage, treatmentIds: p.log.treatments.map((x) => x.id) })
    Object.assign(result, { text: v?.text, abnormal: v?.abnormal, critical: v?.critical })
    updated.log.orders[updated.log.orders.length - 1].seenAtSec = session.nowSec
  }
  return { session: setPatient(session, updated), result }
}

export interface ResultView {
  testId: string
  name: string
  ready: boolean
  readyAtSec: number
  orderedAtSec: number
  seen: boolean
  text?: string
  abnormal?: boolean
  critical?: boolean
  imageId?: string
}

/** Ordered tests with their current state; ready results are resolved against the patient's present stage. */
export function listResults(session: Session, patientId: string, lookup: CaseLookup): ResultView[] {
  const p = session.patients[patientId]
  if (!p) return []
  const c = lookup(p.caseId)
  return p.log.orders.map((o) => {
    const ready = o.readyAtSec <= session.nowSec
    const base = { testId: o.testId, name: c.tests.find((x) => x.testId === o.testId)?.name ?? o.testId, ready, readyAtSec: o.readyAtSec, orderedAtSec: o.atSec, seen: o.seenAtSec !== undefined }
    if (!ready) return base
    const v = resolveTestResult(c, o.testId, { stage: p.stage, treatmentIds: p.log.treatments.filter((x) => x.atSec <= o.readyAtSec).map((x) => x.id) })
    return { ...base, text: v?.text, abnormal: v?.abnormal, critical: v?.critical, imageId: v?.imageId }
  })
}

/** Mark all ready results as seen (counts as "seenResult" in grading). */
export function markResultsSeen(session: Session, patientId: string) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  const orders = p.log.orders.map((o) =>
    o.readyAtSec <= session.nowSec && o.seenAtSec === undefined ? { ...o, seenAtSec: session.nowSec } : o,
  )
  return { session: setPatient(session, { ...p, log: { ...p.log, orders } }), result: { ok: true, patientId, atSec: session.nowSec } satisfies ActionResult }
}

// ---------- treatment ----------

export function giveTreatment(
  session: Session,
  patientId: string,
  treatmentId: string,
  lookup: CaseLookup,
  opts: { dose?: string; duration?: string } = {},
) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  if (p.status !== 'in-bed') return fail(session, patientId, 'not-in-bed')
  const c = lookup(p.caseId)
  const def = c.treatments.find((x) => x.id === treatmentId)
  if (!def) return fail(session, patientId, 'unknown-treatment')
  if (p.log.treatments.some((x) => x.id === treatmentId)) return fail(session, patientId, 'already-given')

  let cur: SessionPatient = {
    ...p,
    log: { ...p.log, treatments: [...p.log.treatments, { id: treatmentId, atSec: session.nowSec, dose: opts.dose, duration: opts.duration }] },
  }
  const effect = c.er?.effects.find((e) => e.treatmentId === treatmentId)
  const events: Omit<SessionEvent, 'id'>[] = []
  if (effect) {
    if (effect.vitalsDelta) cur = { ...cur, vitals: vitalsPlus(cur.vitals, effect.vitalsDelta) }
    if (effect.reliefPain) cur = { ...cur, painRelief: 1 - (1 - cur.painRelief) * (1 - effect.reliefPain) }
    const timeline = c.er?.timeline ?? []
    if (effect.harmful) {
      const entry = timeline[cur.timelineIdx]
      if (entry) {
        const target = entry.stage === 3 ? entry.atSec - 30 : entry.atSec
        cur = { ...cur, exposureSec: Math.max(cur.exposureSec, target) }
      }
    }
    if (effect.improves && cur.stage > 0 && !cur.improvedBy.includes(treatmentId)) {
      const idx = timeline.findIndex((e) => e.stage === cur.stage)
      if (idx >= 0) {
        const fired = timeline[idx]
        cur = {
          ...cur,
          stage: cur.stage - 1,
          timelineIdx: idx,
          exposureSec: Math.max(0, fired.atSec - 90),
          vitals: vitalsPlus(cur.vitals, fired.vitalsDelta, -1),
          improvedBy: [...cur.improvedBy, treatmentId],
          log: { ...cur.log, stageTrail: [...cur.log.stageTrail, { atSec: session.nowSec, stage: cur.stage - 1 }] },
        }
        events.push({ kind: 'stage-averted', atSec: session.nowSec, patientId, label: `${c.patient.name} membaik setelah ${def.name}`, level: 'info', stage: cur.stage })
      }
    }
  }
  const contra = c.contraindicated.some((x) => x.id === treatmentId)
  const harmful = !!effect?.harmful || contra
  const helpful = c.indicatedTreatmentIds.includes(treatmentId)
  const applied = applyAction(
    cur.emotion,
    { kind: 'treat', tone: 'netral', intents: [], helpful, harmful, reliefPain: effect?.reliefPain },
    c,
  )
  cur = traceEmotion({ ...cur, emotion: applied.state }, session.nowSec, applied.trustDelta)
  let out = setPatient(session, cur)
  const pushed = pushEvents(out, events)
  out = pushed.session
  return {
    session: out,
    result: {
      ok: true,
      patientId,
      atSec: session.nowSec,
      trustDelta: applied.trustDelta,
      trust: applied.state.trust,
      mood: applied.state.mood,
      moodChanged: applied.moodChanged,
      events: pushed.events,
      text: contra ? c.contraindicated.find((x) => x.id === treatmentId)?.reason : undefined,
    } satisfies ActionResult,
  }
}

// ---------- disposition ----------

export function dispose(session: Session, patientId: string, dispositionId: string, lookup: CaseLookup) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  if (p.status !== 'in-bed') return fail(session, patientId, 'not-in-bed')
  const c = lookup(p.caseId)
  const dispo = c.dispositions.find((d) => d.id === dispositionId)
  if (!dispo) return fail(session, patientId, 'unknown-disposition')

  const resolved: SessionPatient = {
    ...p,
    status: dispo.outcome,
    log: { ...p.log, dispositionId, dispositionAtSec: session.nowSec, endedAtSec: session.nowSec, outcome: dispo.outcome },
  }
  const beds = session.beds.map((b) => (b === patientId ? null : b))
  let s: Session = setPatient({ ...session, beds }, resolved)
  const evs: Omit<SessionEvent, 'id'>[] = [
    { kind: 'resolved', atSec: session.nowSec, patientId, label: `${c.patient.name}: ${dispo.name} (${formatClock(session.nowSec)})`, level: 'info' },
  ]
  // Poli: next waiting patient takes the chair
  if (s.mode === 'poli') {
    const next = s.order.find((id) => s.patients[id].status === 'waiting')
    if (next) s = seatPatient(s, next, 0, session.nowSec)
  }
  const pushed = pushEvents(s, evs)
  return { session: pushed.session, result: { ok: true, patientId, atSec: session.nowSec, events: pushed.events } satisfies ActionResult }
}

// ---------- status ----------

export function isShiftOver(session: Session) {
  return session.order.every((id) => RESOLVED_STATUSES.includes(session.patients[id].status))
}

export function shiftFailed(session: Session) {
  return session.order.some((id) => session.patients[id].status === 'deceased')
}
