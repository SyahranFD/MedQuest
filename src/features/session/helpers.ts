import type { EncounterLog, Tone } from '@/features/cases/types'
import type { Session, SessionEvent, SessionPatient } from './types'

export function createLog(caseId: string, startedAtSec: number): EncounterLog {
  return {
    caseId,
    startedAtSec,
    askedIds: [],
    chat: [],
    exams: [],
    orders: [],
    treatments: [],
    diagnosisId: null,
    dispositionId: null,
    checklist: { sum: false, safe: false, ice: false },
    emotionTrace: [],
    stageTrail: [{ atSec: startedAtSec, stage: 0 }],
    outcome: 'unfinished',
  }
}

export function traceEmotion(p: SessionPatient, atSec: number, delta: number, tone?: Tone): SessionPatient {
  const e = p.emotion
  return {
    ...p,
    log: {
      ...p.log,
      emotionTrace: [
        ...p.log.emotionTrace,
        {
          atSec,
          trust: Math.round(e.trust * 10) / 10,
          mood: e.mood,
          pain: Math.round(e.pain * 100) / 100,
          patience: Math.round(e.patience * 100) / 100,
          delta: Math.round(delta * 10) / 10,
          ...(tone ? { tone } : {}),
        },
      ],
    },
  }
}

export function setPatient(session: Session, patient: SessionPatient): Session {
  return { ...session, patients: { ...session.patients, [patient.id]: patient } }
}

export function pushEvents(session: Session, events: Omit<SessionEvent, 'id'>[]): { session: Session; events: SessionEvent[] } {
  const start = session.events.length
  const full = events.map((e, i) => ({ ...e, id: start + i }))
  return { session: { ...session, events: [...session.events, ...full] }, events: full }
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
