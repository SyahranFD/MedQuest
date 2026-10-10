import { listCases } from '@/features/cases/repository'
import type { Case, EmotionTracePoint } from '@/features/cases/types'
import type { SessionRecord } from '@/features/session/repository'
import { useSessionStore } from '@/features/session/store'
import type { Session } from '@/features/session/types'

// Start and finish a session. The emotion trace is not part of the saved Evaluation, so the
// simulator keeps its own copy per record to draw the trust sparkline on the debrief.

const TRACE_KEY = 'mq-sim-traces'
const MAX_TRACES = 30

export type TraceMap = Record<string, EmotionTracePoint[]>

function readTraces(): Record<string, TraceMap> {
  try {
    const raw = localStorage.getItem(TRACE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, TraceMap>) : {}
  } catch {
    return {}
  }
}

export function saveTraces(recordId: string, traces: TraceMap) {
  try {
    const all = { ...readTraces(), [recordId]: traces }
    const keys = Object.keys(all)
    for (const k of keys.slice(0, Math.max(0, keys.length - MAX_TRACES))) delete all[k]
    localStorage.setItem(TRACE_KEY, JSON.stringify(all))
  } catch {
    // storage unavailable: the debrief simply has no sparkline
  }
}

export function loadTraces(recordId: string): TraceMap | null {
  return readTraces()[recordId] ?? null
}

export function clearTraces() {
  try {
    localStorage.removeItem(TRACE_KEY)
  } catch {
    // nothing to clear
  }
}

const fresh = new Set<string>()
export const markFresh = (id: string) => void fresh.add(id)
/** True for a record that was just finished, so the grading sequence plays only then. */
export const isFresh = (id: string) => fresh.has(id)
export const clearFresh = (id: string) => void fresh.delete(id)

/** Start a session for a case: poli seats it, ER opens a shift with all ER cases and the chosen one first. */
export async function startCaseSession(c: Case): Promise<Session> {
  const store = useSessionStore.getState()
  const id = `${c.mode}-${Date.now().toString(36)}`
  if (c.mode === 'poli') return store.startSession({ mode: 'poli', caseIds: [c.id], id })
  const er = await listCases({ mode: 'er' })
  const caseIds = [c.id, ...er.filter((x) => x.id !== c.id).map((x) => x.id)]
  const session = store.startSession({ mode: 'er', caseIds, id })
  const arrival = c.er?.arrivalSec ?? 0
  if (arrival > 0) useSessionStore.getState().tick(arrival / session.speed)
  useSessionStore.getState().selectPatient(c.id)
  return useSessionStore.getState().session ?? session
}

/** Grade, save and remember the traces. Resolves with the record the debrief opens. */
export async function finishSession(): Promise<SessionRecord | null> {
  const { session, endSession } = useSessionStore.getState()
  if (!session) return null
  const traces: TraceMap = {}
  for (const id of session.order) {
    const p = session.patients[id]!
    if (p.status !== 'upcoming') traces[p.caseId] = p.log.emotionTrace
  }
  const record = await endSession()
  if (record) {
    saveTraces(record.id, traces)
    markFresh(record.id)
  }
  return record
}
