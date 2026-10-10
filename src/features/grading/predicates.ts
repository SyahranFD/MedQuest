import type { Case, EncounterLog, Pred } from '@/features/cases/types'
import { formatClock } from '@/features/session/helpers'

function origin(log: EncounterLog) {
  return log.bedAtSec ?? log.startedAtSec
}

function treatmentIds(pred: Extract<Pred, { kind: 'treated' }>, c: Case): string[] {
  if (pred.anyOf === 'indicated') return c.indicatedTreatmentIds
  if (pred.anyOf === 'critical') return c.criticalTreatmentIds
  if (pred.anyOf === 'contraindicated') return c.contraindicated.map((x) => x.id)
  return pred.anyOf
}

function matchedTreatments(pred: Extract<Pred, { kind: 'treated' }>, log: EncounterLog, c: Case) {
  const ids = treatmentIds(pred, c)
  return log.treatments.filter(
    (t) => ids.includes(t.id) && (pred.withinSec === undefined || t.atSec - origin(log) <= pred.withinSec),
  )
}

function dispositionMatches(equals: string, log: EncounterLog, c: Case) {
  if (!log.dispositionId) return false
  if (equals === 'correct') return log.dispositionId === c.correctDispositionId
  if (equals === 'acceptable') {
    return log.dispositionId === c.correctDispositionId || c.acceptableDispositionIds.includes(log.dispositionId)
  }
  return log.dispositionId === equals
}

function youMessages(log: EncounterLog) {
  return log.chat.filter((m) => m.who === 'you')
}

export function finalTrust(log: EncounterLog, c: Case) {
  const last = log.emotionTrace[log.emotionTrace.length - 1]
  return last ? last.trust : c.initialTrust
}

/** Evaluate a declarative predicate against an encounter log. Pure. */
export function evalPred(pred: Pred, log: EncounterLog, c: Case): boolean {
  switch (pred.kind) {
    case 'asked':
      return log.askedIds.filter((a, i, arr) => pred.anyOf.includes(a.id) && arr.findIndex((x) => x.id === a.id) === i).length >= (pred.min ?? 1)
    case 'examined':
      return log.exams.filter((e) => pred.anyOf.includes(e.id)).length >= (pred.min ?? 1)
    case 'ordered':
      return log.orders.filter((o) => pred.anyOf.includes(o.testId)).length >= (pred.min ?? 1)
    case 'orderedBefore': {
      const a = log.orders.find((o) => o.testId === pred.first)
      const b = log.orders.find((o) => o.testId === pred.then)
      return !!a && !!b && a.atSec <= b.atSec
    }
    case 'seenResult':
      return log.orders.some((o) => pred.anyOf.includes(o.testId) && o.seenAtSec !== undefined)
    case 'diagnosis':
      return pred.equals === 'correct' ? log.diagnosisId === c.correctDiagnosisId : log.diagnosisId === pred.equals
    case 'treated':
      return matchedTreatments(pred, log, c).length >= (pred.min ?? 1)
    case 'disposition':
      return dispositionMatches(pred.equals, log, c)
    case 'intent':
      return youMessages(log).filter((m) => m.intents?.includes(pred.intent)).length >= (pred.min ?? 1)
    case 'checklist':
      return log.checklist[pred.key]
    case 'survived':
      return log.outcome !== 'deceased'
    case 'triage':
      return !c.er || log.triage?.zone === c.er.triage.zone
    case 'trustAtLeast':
      return finalTrust(log, c) >= pred.value
    case 'toneCount':
      return youMessages(log).filter((m) => m.tone === pred.tone).length <= pred.max
    case 'all':
      return pred.of.every((p) => evalPred(p, log, c))
    case 'any':
      return pred.of.some((p) => evalPred(p, log, c))
    case 'not':
      return !evalPred(pred.of, log, c)
  }
}

/** Human-readable things the log actually contains for this predicate (shown as grading evidence). */
export function collectEvidence(pred: Pred, log: EncounterLog, c: Case): string[] {
  switch (pred.kind) {
    case 'asked':
      return log.askedIds
        .filter((a) => pred.anyOf.includes(a.id))
        .map((a) => `Menit ${formatClock(a.atSec)}: ${c.dialogue.find((d) => d.id === a.id)?.question ?? a.id}`)
    case 'examined':
      return log.exams.filter((e) => pred.anyOf.includes(e.id)).map((e) => `Menit ${formatClock(e.atSec)}: periksa ${c.exam.find((x) => x.id === e.id)?.label ?? e.id}`)
    case 'ordered':
    case 'seenResult': {
      const ids = pred.anyOf
      return log.orders.filter((o) => ids.includes(o.testId)).map((o) => `Menit ${formatClock(o.atSec)}: pesan ${c.tests.find((t) => t.testId === o.testId)?.name ?? o.testId}`)
    }
    case 'orderedBefore':
      return log.orders.filter((o) => o.testId === pred.first || o.testId === pred.then).map((o) => `Menit ${formatClock(o.atSec)}: pesan ${c.tests.find((t) => t.testId === o.testId)?.name ?? o.testId}`)
    case 'diagnosis':
      return log.diagnosisId ? [`Diagnosis Anda: ${c.diagnoses.find((d) => d.id === log.diagnosisId)?.label ?? log.diagnosisId}`] : []
    case 'treated':
      return log.treatments
        .filter((t) => treatmentIds(pred, c).includes(t.id))
        .map((t) => `Menit ${formatClock(t.atSec)}: ${c.treatments.find((x) => x.id === t.id)?.name ?? t.id}`)
    case 'disposition':
      return log.dispositionId ? [`Disposisi: ${c.dispositions.find((d) => d.id === log.dispositionId)?.name ?? log.dispositionId}`] : []
    case 'intent':
      return youMessages(log)
        .filter((m) => m.intents?.includes(pred.intent))
        .map((m) => `Menit ${formatClock(m.atSec)}: "${m.text}"`)
    case 'checklist':
      return log.checklist[pred.key] ? ['Anda mencentang butir ini pada daftar akhir'] : []
    case 'survived':
      return [log.outcome === 'deceased' ? 'Pasien meninggal' : 'Pasien selamat']
    case 'triage':
      return log.triage ? [`Zona triase pilihan Anda: ${log.triage.zone}`] : []
    case 'toneCount': {
      const n = youMessages(log).filter((m) => m.tone === pred.tone).length
      return n > 0 ? [`${n} pesan bernada ${pred.tone}`] : []
    }
    case 'all':
    case 'any':
      return pred.of.flatMap((p) => collectEvidence(p, log, c))
    default:
      return []
  }
}
