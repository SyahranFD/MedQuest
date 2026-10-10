// Local persistence of finished sessions. Async so a backend can replace it; every storage access
// is wrapped in try/catch and every read is validated with zod (invalid rows are dropped).

import { z } from 'zod'
import type { Evaluation } from '@/features/cases/types'
import { createDemoRecords } from './demo-history'

export interface SessionRecord {
  id: string
  mode: 'er' | 'poli'
  /** ISO timestamp. */
  savedAt: string
  durationSec: number
  evaluations: Evaluation[]
  /** Seeded example so the history screen is never empty. */
  demo?: boolean
}

export const STORAGE_KEY = 'mq-sessions'

const band = z.enum(['clear-fail', 'borderline', 'pass', 'good', 'excellent'])
const dimensionScore = z.object({ raw: z.number(), max: z.number(), percent: z.number(), band })
const citation = z.object({ id: z.string(), title: z.string(), issuer: z.string(), year: z.number().optional() })

const evaluationSchema = z.object({
  caseId: z.string(),
  caseTitle: z.string(),
  mode: z.enum(['er', 'poli']),
  band,
  headline: z.string(),
  percent: z.number(),
  dimensions: z.object({
    komunikasi: dimensionScore,
    anamnesis: dimensionScore,
    pemeriksaan: dimensionScore,
    penalaran: dimensionScore,
    terapi: dimensionScore,
    keselamatan: dimensionScore,
  }),
  criteria: z.array(
    z.object({
      id: z.string(),
      dimension: z.enum(['komunikasi', 'anamnesis', 'pemeriksaan', 'penalaran', 'terapi', 'keselamatan']),
      label: z.string(),
      weight: z.number(),
      verdict: z.enum(['met', 'partially-met', 'missed']),
      evidence: z.string(),
      cite: citation.optional(),
    }),
  ),
  breaches: z.array(z.object({ id: z.string(), what: z.string(), cite: citation.optional() })),
  capped: z.boolean(),
  highlights: z.array(z.string()),
  improvements: z.array(z.string()),
  narrative: z.string(),
  empathyScore: z.number(),
  timeline: z.array(
    z.object({
      atSec: z.number(),
      kind: z.enum(['ask', 'exam', 'test', 'result', 'treat', 'dx', 'dispo', 'stage', 'triage', 'chat']),
      label: z.string(),
    }),
  ),
  teachingPoints: z.array(z.string()),
  synthetic: z.literal(true),
})

export const sessionRecordSchema = z.object({
  id: z.string(),
  mode: z.enum(['er', 'poli']),
  savedAt: z.string(),
  durationSec: z.number(),
  evaluations: z.array(evaluationSchema),
  demo: z.boolean().optional(),
})

function readAll(): SessionRecord[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((row) => {
      const r = sessionRecordSchema.safeParse(row)
      return r.success ? [r.data as SessionRecord] : []
    })
  } catch {
    return null
  }
}

function writeAll(records: SessionRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

const bySavedDesc = (a: SessionRecord, b: SessionRecord) => b.savedAt.localeCompare(a.savedAt)

/** All saved sessions, newest first. The first read seeds demo history. */
export async function listSessionResults(): Promise<SessionRecord[]> {
  const stored = readAll()
  if (stored === null) {
    const demo = createDemoRecords()
    writeAll(demo)
    return demo.slice().sort(bySavedDesc)
  }
  return stored.slice().sort(bySavedDesc)
}

export async function getSessionResult(id: string): Promise<SessionRecord | undefined> {
  return (await listSessionResults()).find((r) => r.id === id)
}

export async function saveSessionResult(record: SessionRecord): Promise<boolean> {
  const current = readAll() ?? createDemoRecords()
  const next = [record, ...current.filter((r) => r.id !== record.id)].slice(0, 100)
  return writeAll(next)
}

export async function clearSessionResults(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable: nothing to clear
  }
}
