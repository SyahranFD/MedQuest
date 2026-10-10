// Pure session operations for dialogue, examination, diagnosis and wrap-up. Every function takes a
// Session and returns { session, result } where result is what the UI renders.

import type { Case, DialogueEntry, Evaluation } from '@/features/cases/types'
import { answerEntry, matchReply } from '@/features/dialogue/match'
import type { MatchResult } from '@/features/dialogue/match'
import { grade } from '@/features/grading/grade'
import { applyAction } from './emotion-engine'
import { setPatient, traceEmotion } from './helpers'
import type { ActionResult, CaseLookup, Session, SessionPatient } from './types'

function fail(session: Session, patientId: string, error: string): { session: Session; result: ActionResult } {
  return { session, result: { ok: false, error, patientId, atSec: session.nowSec } }
}

/** Real milliseconds a reply takes to "speak", for the talking animation. */
export function speakDurationMs(reply: string) {
  return Math.min(6000, Math.max(900, reply.length * 45))
}

function seated(session: Session, patientId: string): SessionPatient | undefined {
  const p = session.patients[patientId]
  return p && p.status === 'in-bed' ? p : undefined
}

function applyDialogue(
  session: Session,
  p: SessionPatient,
  caseDef: Case,
  text: string,
  match: MatchResult,
  via: 'click' | 'chat',
) {
  const applied = applyAction(p.emotion, match.action, caseDef)
  const speakMs = speakDurationMs(match.reply)
  const entry = match.entry
  let askedIds = p.log.askedIds
  if (entry && !match.withheld && !match.repeated) {
    askedIds = [...askedIds, { id: entry.id, atSec: session.nowSec, via }]
  }
  let next: SessionPatient = {
    ...p,
    emotion: applied.state,
    speakingUntilSec: session.nowSec + (speakMs / 1000) * session.speed,
    log: {
      ...p.log,
      askedIds,
      chat: [
        ...p.log.chat,
        { who: 'you', text, atSec: session.nowSec, tone: match.tone, intents: match.intents },
        { who: 'patient', text: match.reply, atSec: session.nowSec },
      ],
    },
  }
  next = traceEmotion(next, session.nowSec, applied.trustDelta, match.tone)
  const result: ActionResult = {
    ok: true,
    patientId: p.id,
    atSec: session.nowSec,
    reply: match.reply,
    speakMs,
    entryId: entry?.id,
    tone: match.tone,
    intents: match.intents,
    withheld: match.withheld,
    unclear: match.kind === 'unclear',
    trustDelta: applied.trustDelta,
    trust: applied.state.trust,
    mood: applied.state.mood,
    moodChanged: applied.moodChanged,
  }
  return { session: setPatient(session, next), result }
}

function isInterrupted(session: Session, p: SessionPatient, override?: boolean) {
  return override ?? session.nowSec < p.speakingUntilSec
}

/** Click a catalogue question. */
export function askQuestion(
  session: Session,
  patientId: string,
  entryId: string,
  lookup: CaseLookup,
  opts: { interrupted?: boolean } = {},
) {
  const p = seated(session, patientId)
  if (!p) return fail(session, patientId, 'not-in-bed')
  const c = lookup(p.caseId)
  const entry: DialogueEntry | undefined = c.dialogue.find((d) => d.id === entryId)
  if (!entry) return fail(session, patientId, 'unknown-question')
  const interrupted = isInterrupted(session, p, opts.interrupted)
  const match = answerEntry(c, entry, p.emotion, {
    askedIds: p.log.askedIds.map((a) => a.id),
    interrupted,
    kind: 'ask',
  })
  return applyDialogue(session, p, c, entry.question, match, 'click')
}

/** Free typed text. */
export function typeMessage(
  session: Session,
  patientId: string,
  text: string,
  lookup: CaseLookup,
  opts: { interrupted?: boolean } = {},
) {
  const p = seated(session, patientId)
  if (!p) return fail(session, patientId, 'not-in-bed')
  const trimmed = text.trim()
  if (!trimmed) return fail(session, patientId, 'empty')
  const c = lookup(p.caseId)
  const interrupted = isInterrupted(session, p, opts.interrupted)
  const variantIndex = p.log.chat.filter((m) => m.who === 'patient').length
  const match = matchReply(c, trimmed, p.emotion, {
    askedIds: p.log.askedIds.map((a) => a.id),
    interrupted,
    variantIndex,
  })
  return applyDialogue(session, p, c, trimmed, match, 'chat')
}

export function examine(session: Session, patientId: string, examId: string, lookup: CaseLookup) {
  const p = seated(session, patientId)
  if (!p) return fail(session, patientId, 'not-in-bed')
  const c = lookup(p.caseId)
  const finding = c.exam.find((x) => x.id === examId)
  if (!finding) return fail(session, patientId, 'unknown-exam')
  const result: ActionResult = {
    ok: true,
    patientId,
    atSec: session.nowSec,
    text: finding.finding,
    abnormal: finding.abnormal,
  }
  if (p.log.exams.some((x) => x.id === examId)) return { session, result }
  const consent = p.log.chat.some((m) => m.who === 'you' && m.intents?.includes('consent'))
  const applied = applyAction(p.emotion, { kind: 'examine', tone: 'netral', intents: [], consent }, c)
  const next = traceEmotion(
    { ...p, emotion: applied.state, log: { ...p.log, exams: [...p.log.exams, { id: examId, atSec: session.nowSec }] } },
    session.nowSec,
    applied.trustDelta,
  )
  return {
    session: setPatient(session, next),
    result: {
      ...result,
      trustDelta: applied.trustDelta,
      trust: applied.state.trust,
      mood: applied.state.mood,
      moodChanged: applied.moodChanged,
    },
  }
}

/** The diagnosis is locked after the first pick, with instant right or wrong feedback. */
export function diagnose(session: Session, patientId: string, diagnosisId: string, lookup: CaseLookup) {
  const p = seated(session, patientId)
  if (!p) return fail(session, patientId, 'not-in-bed')
  if (p.log.diagnosisId) return fail(session, patientId, 'diagnosis-locked')
  const c = lookup(p.caseId)
  if (!c.diagnoses.some((d) => d.id === diagnosisId)) return fail(session, patientId, 'unknown-diagnosis')
  const next = { ...p, log: { ...p.log, diagnosisId, diagnosisAtSec: session.nowSec } }
  return {
    session: setPatient(session, next),
    result: {
      ok: true,
      patientId,
      atSec: session.nowSec,
      correct: diagnosisId === c.correctDiagnosisId,
      text: c.diagnoses.find((d) => d.id === c.correctDiagnosisId)?.label,
    } satisfies ActionResult,
  }
}

export function setChecklist(
  session: Session,
  patientId: string,
  checklist: Partial<SessionPatient['log']['checklist']>,
) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  const next = { ...p, log: { ...p.log, checklist: { ...p.log.checklist, ...checklist } } }
  return { session: setPatient(session, next), result: { ok: true, patientId, atSec: session.nowSec } satisfies ActionResult }
}

/** Close the encounter log for one patient (outcome stays "unfinished" if no disposition was chosen). */
export function endEncounter(session: Session, patientId: string) {
  const p = session.patients[patientId]
  if (!p) return fail(session, patientId, 'unknown-patient')
  if (p.log.endedAtSec !== undefined) {
    return { session, result: { ok: true, patientId, atSec: session.nowSec } satisfies ActionResult }
  }
  const next = { ...p, log: { ...p.log, endedAtSec: session.nowSec } }
  return { session: setPatient(session, next), result: { ok: true, patientId, atSec: session.nowSec } satisfies ActionResult }
}

/** End the whole session and grade every patient that was seen. */
export function finalizeSession(session: Session, lookup: CaseLookup): { session: Session; evaluations: Evaluation[] } {
  let s: Session = session
  const evaluations: Evaluation[] = []
  for (const id of session.order) {
    const p = s.patients[id]
    if (p.status === 'upcoming') continue
    s = endEncounter(s, id).session
    evaluations.push(grade(s.patients[id].log, lookup(p.caseId)))
  }
  return { session: { ...s, status: 'ended' }, evaluations }
}
