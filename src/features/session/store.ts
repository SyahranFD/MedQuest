import { create } from 'zustand'
import { requireCase } from '@/features/cases/repository'
import type { Evaluation, Zone } from '@/features/cases/types'
import {
  advanceTo,
  assignBed as erAssignBed,
  createSession,
  dispose as erDispose,
  giveTreatment,
  isShiftOver,
  listResults,
  markResultsSeen,
  orderTest as erOrderTest,
  setTriage,
  shiftFailed,
} from '@/features/session/er-engine'
import type { ResultView } from '@/features/session/er-engine'
import {
  askQuestion as engineAsk,
  diagnose as engineDiagnose,
  endEncounter,
  examine as engineExamine,
  finalizeSession,
  setChecklist as engineChecklist,
  typeMessage as engineType,
} from '@/features/session/session-engine'
import { saveSessionResult } from '@/features/session/repository'
import type { SessionRecord } from '@/features/session/repository'
import { toVisual } from '@/features/session/emotion-engine'
import type { ActionResult, Session, SessionEvent } from '@/features/session/types'
import type { PatientVisual } from '@/lib/emotion'
import type { ScenePatient } from '@/lib/scene-contract'

// UI-agnostic live session store. Every action returns an ActionResult the simulator can render;
// time only moves through tick(dtRealSeconds).

export interface StartSessionInput {
  mode: 'er' | 'poli'
  caseIds: string[]
  seed?: number
  speed?: number
  id?: string
}

interface Outcome {
  session: Session
  result: ActionResult
}

interface SessionState {
  session: Session | null
  activePatientId: string | null
  lastResult: ActionResult | null
  /** Events produced by ticks and actions, newest last (UI can toast from here). */
  feed: SessionEvent[]
  evaluations: Evaluation[] | null
  lastRecordId: string | null

  startSession: (input: StartSessionInput) => Session
  setSpeed: (speed: number) => void
  selectPatient: (patientId: string | null) => void
  assignBed: (patientId: string, bedIndex: number) => ActionResult
  triage: (patientId: string, zone: Zone) => ActionResult
  askQuestion: (patientId: string, entryId: string, opts?: { interrupted?: boolean }) => ActionResult
  typeMessage: (patientId: string, text: string, opts?: { interrupted?: boolean }) => ActionResult
  examine: (patientId: string, examId: string) => ActionResult
  orderTest: (patientId: string, testId: string) => ActionResult
  /** Advance the simulation by real seconds (scaled by speed). Returns the events that fired. */
  tick: (dtRealSeconds: number) => SessionEvent[]
  /** Ready results for a patient; marks them seen when markSeen is true. */
  receiveResults: (patientId: string, markSeen?: boolean) => ResultView[]
  diagnose: (patientId: string, diagnosisId: string) => ActionResult
  /** ER treatment or poli prescription (dose and duration are logged for grading). */
  treat: (patientId: string, treatmentId: string, opts?: { dose?: string; duration?: string }) => ActionResult
  prescribe: (patientId: string, treatmentId: string, opts?: { dose?: string; duration?: string }) => ActionResult
  dispose: (patientId: string, dispositionId: string) => ActionResult
  setChecklist: (patientId: string, checklist: { sum?: boolean; safe?: boolean; ice?: boolean }) => ActionResult
  /** Grade every patient, save the record, mark the session ended. */
  endSession: () => Promise<SessionRecord | null>
  reset: () => void
}

export const useSessionStore = create<SessionState>((set, get) => {
  const run = (patientId: string, fn: (s: Session) => Outcome): ActionResult => {
    const { session } = get()
    if (!session || session.status !== 'active') {
      return { ok: false, error: 'no-active-session', patientId, atSec: session?.nowSec ?? 0 }
    }
    const out = fn(session)
    set((st) => ({
      session: out.session,
      lastResult: out.result,
      feed: out.result.events?.length ? [...st.feed, ...out.result.events] : st.feed,
    }))
    return out.result
  }

  return {
    session: null,
    activePatientId: null,
    lastResult: null,
    feed: [],
    evaluations: null,
    lastRecordId: null,

    startSession: (input) => {
      const session = createSession({
        mode: input.mode,
        cases: input.caseIds.map(requireCase),
        seed: input.seed,
        speed: input.speed,
        id: input.id,
      })
      const first = session.order.find((id) => session.patients[id].status === 'in-bed' || session.patients[id].status === 'waiting') ?? null
      set({ session, activePatientId: first, lastResult: null, feed: session.events.slice(), evaluations: null, lastRecordId: null })
      return session
    },

    setSpeed: (speed) => set((st) => (st.session ? { session: { ...st.session, speed: Math.max(0.1, speed) } } : st)),

    selectPatient: (patientId) => set({ activePatientId: patientId }),

    assignBed: (patientId, bedIndex) => run(patientId, (s) => erAssignBed(s, patientId, bedIndex)),
    triage: (patientId, zone) => run(patientId, (s) => setTriage(s, patientId, zone, requireCase)),
    askQuestion: (patientId, entryId, opts) => run(patientId, (s) => engineAsk(s, patientId, entryId, requireCase, opts)),
    typeMessage: (patientId, text, opts) => run(patientId, (s) => engineType(s, patientId, text, requireCase, opts)),
    examine: (patientId, examId) => run(patientId, (s) => engineExamine(s, patientId, examId, requireCase)),
    orderTest: (patientId, testId) => run(patientId, (s) => erOrderTest(s, patientId, testId, requireCase)),

    tick: (dtRealSeconds) => {
      const { session } = get()
      if (!session || session.status !== 'active' || dtRealSeconds <= 0) return []
      const out = advanceTo(session, session.nowSec + dtRealSeconds * session.speed, requireCase)
      set((st) => ({ session: out.session, feed: out.events.length ? [...st.feed, ...out.events] : st.feed }))
      return out.events
    },

    receiveResults: (patientId, markSeen = true) => {
      const { session } = get()
      if (!session) return []
      const views = listResults(session, patientId, requireCase)
      if (markSeen) {
        const out = markResultsSeen(session, patientId)
        set({ session: out.session })
      }
      return views.filter((v) => v.ready)
    },

    diagnose: (patientId, diagnosisId) => run(patientId, (s) => engineDiagnose(s, patientId, diagnosisId, requireCase)),
    treat: (patientId, treatmentId, opts) => run(patientId, (s) => giveTreatment(s, patientId, treatmentId, requireCase, opts)),
    prescribe: (patientId, treatmentId, opts) => get().treat(patientId, treatmentId, opts),
    dispose: (patientId, dispositionId) => run(patientId, (s) => erDispose(s, patientId, dispositionId, requireCase)),
    setChecklist: (patientId, checklist) => run(patientId, (s) => engineChecklist(s, patientId, checklist)),

    endSession: async () => {
      const { session } = get()
      if (!session || session.status !== 'active') return null
      let s = session
      for (const id of s.order) s = endEncounter(s, id).session
      const { session: ended, evaluations } = finalizeSession(s, requireCase)
      const record: SessionRecord = {
        id: `ses-${ended.id}-${Math.round(ended.nowSec)}`,
        mode: ended.mode,
        savedAt: new Date().toISOString(),
        durationSec: Math.round(ended.nowSec),
        evaluations,
      }
      set({ session: ended, evaluations, lastRecordId: record.id })
      await saveSessionResult(record)
      return record
    },

    reset: () => set({ session: null, activePatientId: null, lastResult: null, feed: [], evaluations: null, lastRecordId: null }),
  }
})

// ---------- selectors (plain functions of the store state) ----------

export const selectShiftOver = (s: SessionState) => (s.session ? isShiftOver(s.session) : false)
export const selectShiftFailed = (s: SessionState) => (s.session ? shiftFailed(s.session) : false)

/** PatientVisual for one patient; `talking` is supplied by the caller (UI knows when audio plays). */
export function selectVisual(s: SessionState, patientId: string, talking = false): PatientVisual | null {
  const p = s.session?.patients[patientId]
  if (!p) return null
  const c = requireCase(p.caseId)
  return toVisual(p.emotion, { seed: p.seed, age: c.patient.age, gender: c.patient.gender, talking, pose: c.mode === 'er' ? 'lying' : 'sitting' })
}

/** Props slice for the 3D scene: arrived patients with visuals and ER bed index. `statusLabel` is a status key ('kritis', 'memburuk', 'meninggal') for the UI to translate. */
export function selectScenePatients(s: SessionState, talkingId: string | null = null): ScenePatient[] {
  const session = s.session
  if (!session) return []
  const out: ScenePatient[] = []
  for (const id of session.order) {
    const p = session.patients[id]
    if (p.status === 'upcoming') continue
    const visual = selectVisual(s, id, id === talkingId)
    if (!visual) continue
    out.push({
      id,
      ...(p.bedIndex !== null ? { bedIndex: p.bedIndex } : {}),
      visual: p.status === 'waiting' ? { ...visual, pose: 'standing' } : p.status === 'deceased' ? { ...visual, emotion: 'netral', intensity: 0.2, talking: false } : visual,
      ...(p.status === 'deceased'
        ? { statusLabel: 'meninggal', statusTone: 'danger' as const }
        : p.stage >= 2
          ? { statusLabel: 'kritis', statusTone: 'danger' as const }
          : p.stage === 1
            ? { statusLabel: 'memburuk', statusTone: 'warning' as const }
            : {}),
    })
  }
  return out
}

