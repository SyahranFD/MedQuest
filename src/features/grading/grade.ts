// Deterministic grader: declarative rubric predicates over the encounter log. No randomness, no clock.

import { clamp } from '@/lib/emotion'
import { DIMENSIONS } from '@/features/cases/types'
import type {
  Band,
  Case,
  Criterion,
  CriterionResult,
  DimensionScore,
  Dimension,
  EncounterLog,
  Evaluation,
  Intent,
  TimelineItem,
  Verdict,
} from '@/features/cases/types'
import { formatClock } from '@/features/session/helpers'
import { citationFor } from './guidelines'
import { collectEvidence, evalPred, finalTrust } from './predicates'

export const BAND_THRESHOLDS: { band: Band; min: number }[] = [
  { band: 'excellent', min: 90 },
  { band: 'good', min: 75 },
  { band: 'pass', min: 60 },
  { band: 'borderline', min: 40 },
  { band: 'clear-fail', min: 0 },
]

export const BAND_RANK: Record<Band, number> = { 'clear-fail': 0, borderline: 1, pass: 2, good: 3, excellent: 4 }

export const BAND_HEADLINES: Record<Band, string> = {
  excellent: 'Sangat baik, penanganan hampir sempurna',
  good: 'Baik, kasus ditangani dengan tepat',
  pass: 'Lulus, tetap ada yang bisa diperbaiki',
  borderline: 'Batas lulus, sebaiknya diulang',
  'clear-fail': 'Belum lulus, coba ulangi kasus ini',
}

const BAND_OPENING: Record<Band, string> = {
  excellent: 'Penanganan Anda hampir sempurna.',
  good: 'Penanganan Anda sudah baik, tinggal beberapa hal kecil yang bisa dirapikan.',
  pass: 'Anda sudah melewati standar minimal, tetapi masih ada yang perlu dilengkapi.',
  borderline: 'Anda tepat di batas lulus karena beberapa langkah penting terlewat.',
  'clear-fail': 'Penanganan Anda belum memenuhi standar minimal untuk kasus ini.',
}

export function bandForPercent(percent: number): Band {
  return BAND_THRESHOLDS.find((t) => percent >= t.min)?.band ?? 'clear-fail'
}

function verdictOf(c: Criterion, log: EncounterLog, kase: Case): Verdict {
  if (evalPred(c.met, log, kase)) return 'met'
  if (c.partial && evalPred(c.partial, log, kase)) return 'partially-met'
  return 'missed'
}

function evidenceText(c: Criterion, verdict: Verdict, log: EncounterLog, kase: Case) {
  const base = verdict === 'met' ? c.evidence.met : verdict === 'partially-met' ? (c.evidence.partial ?? c.evidence.met) : c.evidence.missed
  const detected = collectEvidence(c.partial ? { kind: 'any', of: [c.met, c.partial] } : c.met, log, kase)
  const unique = [...new Set(detected)].slice(0, 4)
  if (verdict === 'missed' && unique.length === 0) return `${base} Tidak ada yang terdeteksi di catatan sesi.`
  return unique.length ? `${base} Terdeteksi: ${unique.join('; ')}.` : base
}

const EMPATHIC_INTENTS: Intent[] = ['empathy', 'reassure', 'ice-ideas', 'ice-concerns', 'ice-expectations', 'consent', 'intro', 'greet', 'summary']

/**
 * Empathy score 0..100 from the emotion trace:
 * 50% final trust + up to 30 for the share of empathic messages + up to 20 for variety of
 * empathic intents, minus 10 per blaming message and 4 per interruption.
 */
export function empathyScore(log: EncounterLog, kase: Case): number {
  const you = log.chat.filter((m) => m.who === 'you')
  const share = you.length ? you.filter((m) => m.tone === 'empatik').length / you.length : 0
  const distinct = new Set(you.flatMap((m) => m.intents ?? []).filter((i) => EMPATHIC_INTENTS.includes(i))).size
  const blame = you.filter((m) => m.tone === 'menghakimi').length
  const interrupt = you.filter((m) => m.tone === 'menyela').length
  const score = 0.5 * finalTrust(log, kase) + 30 * share + Math.min(20, distinct * 4) - 10 * blame - 4 * interrupt
  return Math.round(clamp(score, 0, 100))
}

export function buildTimeline(log: EncounterLog, kase: Case): TimelineItem[] {
  const items: TimelineItem[] = []
  if (log.triage) items.push({ atSec: log.triage.atSec, kind: 'triage', label: `Triase zona ${log.triage.zone}` })
  for (const a of log.askedIds) {
    items.push({ atSec: a.atSec, kind: 'ask', label: kase.dialogue.find((d) => d.id === a.id)?.question ?? a.id })
  }
  for (const m of log.chat) {
    if (m.who === 'you' && m.tone && (m.tone !== 'netral' || (m.intents?.length ?? 0) > 0) && !log.askedIds.some((a) => a.atSec === m.atSec && a.via === 'chat')) {
      items.push({ atSec: m.atSec, kind: 'chat', label: `Anda: "${m.text}"` })
    }
  }
  for (const e of log.exams) items.push({ atSec: e.atSec, kind: 'exam', label: `Periksa ${kase.exam.find((x) => x.id === e.id)?.label ?? e.id}` })
  for (const o of log.orders) {
    const name = kase.tests.find((t) => t.testId === o.testId)?.name ?? o.testId
    items.push({ atSec: o.atSec, kind: 'test', label: `Pesan ${name}` })
    if (o.readyAtSec > o.atSec) items.push({ atSec: o.readyAtSec, kind: 'result', label: `Hasil ${name} tersedia` })
  }
  for (const t of log.treatments) items.push({ atSec: t.atSec, kind: 'treat', label: kase.treatments.find((x) => x.id === t.id)?.name ?? t.id })
  if (log.diagnosisId) {
    items.push({ atSec: log.diagnosisAtSec ?? log.endedAtSec ?? 0, kind: 'dx', label: `Diagnosis: ${kase.diagnoses.find((d) => d.id === log.diagnosisId)?.label ?? log.diagnosisId}` })
  }
  if (log.dispositionId) {
    items.push({ atSec: log.dispositionAtSec ?? log.endedAtSec ?? 0, kind: 'dispo', label: `Disposisi: ${kase.dispositions.find((d) => d.id === log.dispositionId)?.name ?? log.dispositionId}` })
  }
  let prev = 0
  for (const s of log.stageTrail) {
    if (s.stage !== prev) {
      items.push({ atSec: s.atSec, kind: 'stage', label: s.stage > prev ? `Kondisi memburuk ke tahap ${s.stage}` : `Kondisi membaik ke tahap ${s.stage}` })
    }
    prev = s.stage
  }
  return items.sort((a, b) => a.atSec - b.atSec)
}

export function grade(log: EncounterLog, kase: Case): Evaluation {
  const results: CriterionResult[] = []
  const raw: Record<Dimension, number> = { komunikasi: 0, anamnesis: 0, pemeriksaan: 0, penalaran: 0, terapi: 0, keselamatan: 0 }
  const max: Record<Dimension, number> = { ...raw }

  for (const c of kase.rubric.criteria) {
    const verdict = verdictOf(c, log, kase)
    max[c.dimension] += c.weight
    raw[c.dimension] += c.weight * (verdict === 'met' ? 1 : verdict === 'partially-met' ? 0.5 : 0)
    results.push({
      id: c.id,
      dimension: c.dimension,
      label: c.label,
      weight: c.weight,
      verdict,
      evidence: evidenceText(c, verdict, log, kase),
      ...(c.guidelineRef && citationFor(c.guidelineRef) ? { cite: citationFor(c.guidelineRef) } : {}),
    })
  }

  const dimensions = {} as Record<Dimension, DimensionScore>
  for (const d of DIMENSIONS) {
    const percent = max[d] ? (raw[d] / max[d]) * 100 : 100
    dimensions[d] = { raw: raw[d], max: max[d], percent: Math.round(percent), band: bandForPercent(percent) }
  }
  const totalRaw = DIMENSIONS.reduce((s, d) => s + raw[d], 0)
  const totalMax = DIMENSIONS.reduce((s, d) => s + max[d], 0)
  const percent = totalMax ? Math.round((totalRaw / totalMax) * 100) : 0

  const breaches = kase.rubric.breaches
    .filter((b) => evalPred(b.when, log, kase))
    .map((b) => ({ id: b.id, what: b.what, ...(b.guidelineRef && citationFor(b.guidelineRef) ? { cite: citationFor(b.guidelineRef) } : {}) }))
  const died = log.outcome === 'deceased'
  if (died && !breaches.some((b) => b.id === 'death')) {
    breaches.unshift({ id: 'death', what: 'Pasien meninggal selama penanganan.' })
  }

  let band = bandForPercent(percent)
  let capped = false
  if (died) {
    if (band !== 'clear-fail') capped = true
    band = 'clear-fail'
  } else if (breaches.length > 0 && BAND_RANK[band] > BAND_RANK.borderline) {
    band = 'borderline'
    capped = true
  }

  const metSorted = kase.rubric.criteria
    .filter((c) => results.find((r) => r.id === c.id)?.verdict === 'met' && c.highlight)
    .sort((a, b) => b.weight - a.weight)
  const missedSorted = kase.rubric.criteria
    .filter((c) => results.find((r) => r.id === c.id)?.verdict !== 'met' && c.improvement)
    .sort((a, b) => b.weight - a.weight)
  const highlights = metSorted.slice(0, 3).map((c) => c.highlight as string)
  const improvements = missedSorted.slice(0, 3).map((c) => c.improvement as string)
  if (breaches.length > 0) improvements.unshift(`Prioritas keselamatan: ${breaches[0].what}`)

  const empathy = empathyScore(log, kase)
  const narrative = [
    BAND_OPENING[band],
    breaches.length ? `Perhatian utama: ${breaches[0].what}` : '',
    highlights.length ? `Yang sudah baik: ${highlights.slice(0, 2).join(' ')}` : '',
    improvements.length ? `Saran perbaikan: ${improvements.slice(0, 2).join(' ')}` : '',
    `Skor empati Anda ${empathy} dari 100. Lama sesi ${formatClock((log.endedAtSec ?? 0) - log.startedAtSec)}.`,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    caseId: kase.id,
    caseTitle: kase.title,
    mode: kase.mode,
    band,
    headline: BAND_HEADLINES[band],
    percent,
    dimensions,
    criteria: results,
    breaches,
    capped,
    highlights,
    improvements: improvements.slice(0, 4),
    narrative,
    empathyScore: empathy,
    timeline: buildTimeline(log, kase),
    teachingPoints: kase.rubric.teachingPoints,
    synthetic: true,
  }
}
