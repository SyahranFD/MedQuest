import type { Emotion } from '@/lib/emotion'
import type { Case, EncounterLog, Intent, Tone, Vitals, Zone } from '@/features/cases/types'
import type { EmotionState } from './emotion-engine'

export type PatientStatus =
  | 'upcoming'
  | 'waiting'
  | 'in-bed'
  | 'discharged'
  | 'admitted'
  | 'transferred'
  | 'deceased'

export const RESOLVED_STATUSES: readonly PatientStatus[] = ['discharged', 'admitted', 'transferred', 'deceased']

export interface SessionPatient {
  id: string
  caseId: string
  /** Deterministic avatar seed (the case id). */
  seed: string
  status: PatientStatus
  bedIndex: number | null
  arrivalSec: number
  bedAtSec: number | null
  /** Highest deterioration stage reached, 0 to 3. */
  stage: number
  /** Index of the next timeline entry to evaluate. */
  timelineIdx: number
  /** Accumulated deterioration exposure in seconds. */
  exposureSec: number
  vitals: Vitals
  emotion: EmotionState
  log: EncounterLog
  /** Simulated second until which the patient is still speaking (interruption detection). */
  speakingUntilSec: number
  /** Cumulative fraction of pain relieved by treatment, 0 to 1. */
  painRelief: number
  /** Treatments whose "improves" effect was already used. */
  improvedBy: string[]
  timeUpNotified: boolean
}

export type SessionEventKind =
  | 'arrival'
  | 'result-ready'
  | 'stage'
  | 'death'
  | 'resolved'
  | 'time-up'
  | 'stage-averted'

export interface SessionEvent {
  id: number
  kind: SessionEventKind
  atSec: number
  patientId: string
  label: string
  level: 'info' | 'warning' | 'critical'
  testId?: string
  abnormal?: boolean
  critical?: boolean
  stage?: number
}

export interface Session {
  id: string
  mode: 'er' | 'poli'
  seed: number
  /** Simulated seconds since the session began. */
  nowSec: number
  /** Simulated seconds per real second. */
  speed: number
  beds: (string | null)[]
  patients: Record<string, SessionPatient>
  /** Patient ids in arrival order. */
  order: string[]
  events: SessionEvent[]
  status: 'active' | 'ended'
  /** Poli consultation soft limit in simulated seconds (0 = none). */
  consultLimitSec: number
}

export type CaseLookup = (caseId: string) => Case

/** Update the UI can render after one action. */
export interface ActionResult {
  ok: boolean
  error?: string
  patientId: string
  atSec: number
  /** What the patient says (dialogue actions). */
  reply?: string
  /** Rough speaking duration for the talking animation, in real milliseconds. */
  speakMs?: number
  entryId?: string
  tone?: Tone
  intents?: Intent[]
  withheld?: boolean
  unclear?: boolean
  trustDelta?: number
  trust?: number
  mood?: Emotion
  moodChanged?: boolean
  /** examine / order / diagnose etc. */
  text?: string
  abnormal?: boolean
  critical?: boolean
  /** Result of an order when instant (poli) or already ready. */
  ready?: boolean
  readyAtSec?: number
  /** diagnose */
  correct?: boolean
  /** Events produced by the action (stage changes, resolution). */
  events?: SessionEvent[]
}

export interface BedSummary {
  bedIndex: number
  patientId: string | null
  zone: Zone | null
}
