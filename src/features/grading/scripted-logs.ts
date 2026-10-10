// Scripted encounter logs derived from a case rubric. Used by tests (perfect and bad playthroughs)
// and to seed the demo history. Messages are real sentences run through the real tone classifier.

import type { Case, EncounterLog, Intent, Pred } from '@/features/cases/types'
import { classifyTone } from '@/features/dialogue/tone'
import { createLog } from '@/features/session/helpers'

export type ScriptKind = 'perfect' | 'average' | 'bad'

const PHRASES: Partial<Record<Intent, string>> = {
  greet: 'Selamat pagi, saya senang bertemu dengan Anda.',
  intro: 'Perkenalkan, nama saya dokter muda yang bertugas hari ini.',
  consent: 'Izin ya, saya periksa dulu.',
  empathy: 'Saya mengerti, ini pasti tidak nyaman bagi Anda.',
  reassure: 'Tenang ya, kami akan bantu.',
  summary: 'Jadi sejak awal keluhannya seperti itu, benar begitu?',
  'safety-net': 'Segera kembali jika keluhan bertambah berat.',
  agenda: 'Saya akan menanyakan beberapa pertanyaan dulu.',
  'plain-language': 'Artinya, kita perlu memeriksa lebih lanjut.',
}

interface Plan {
  intents: Intent[]
  asked: string[]
  exams: string[]
  orders: string[]
  treatments: string[]
  checklist: Partial<EncounterLog['checklist']>
  diagnosis: string | null
  disposition: string | null
  triage: boolean
  seen: Set<string>
}

function add(list: string[], id: string) {
  if (!list.includes(id)) list.push(id)
}

function satisfy(pred: Pred, plan: Plan, c: Case): void {
  switch (pred.kind) {
    case 'asked':
      pred.anyOf.slice(0, Math.max(pred.min ?? 1, 1)).forEach((id) => add(plan.asked, id))
      break
    case 'examined':
      pred.anyOf.slice(0, Math.max(pred.min ?? 1, 1)).forEach((id) => add(plan.exams, id))
      break
    case 'ordered':
      pred.anyOf.slice(0, Math.max(pred.min ?? 1, 1)).forEach((id) => add(plan.orders, id))
      break
    case 'orderedBefore':
      add(plan.orders, pred.first)
      add(plan.orders, pred.then)
      break
    case 'seenResult':
      pred.anyOf.forEach((id) => {
        add(plan.orders, id)
        plan.seen.add(id)
      })
      break
    case 'diagnosis':
      plan.diagnosis = pred.equals === 'correct' ? c.correctDiagnosisId : pred.equals
      break
    case 'treated': {
      const ids =
        pred.anyOf === 'indicated'
          ? c.indicatedTreatmentIds
          : pred.anyOf === 'critical'
            ? c.criticalTreatmentIds
            : pred.anyOf === 'contraindicated'
              ? []
              : pred.anyOf
      ids.slice(0, Math.max(pred.min ?? 1, 1)).forEach((id) => add(plan.treatments, id))
      break
    }
    case 'disposition':
      plan.disposition = pred.equals === 'correct' || pred.equals === 'acceptable' ? c.correctDispositionId : pred.equals
      break
    case 'intent':
      if (!plan.intents.includes(pred.intent)) plan.intents.push(pred.intent)
      break
    case 'checklist':
      plan.checklist[pred.key] = true
      break
    case 'triage':
      plan.triage = true
      break
    case 'all':
      pred.of.forEach((p) => satisfy(p, plan, c))
      break
    case 'any':
      if (pred.of[0]) satisfy(pred.of[0], plan, c)
      break
    default:
      break
  }
}

function emptyPlan(): Plan {
  return {
    intents: [],
    asked: [],
    exams: [],
    orders: [],
    treatments: [],
    checklist: {},
    diagnosis: null,
    disposition: null,
    triage: false,
    seen: new Set(),
  }
}

function planFor(c: Case, kind: ScriptKind): Plan {
  const plan = emptyPlan()
  if (kind === 'bad') return plan
  for (const crit of c.rubric.criteria) {
    if (kind === 'average' && (crit.dimension === 'komunikasi' || crit.dimension === 'pemeriksaan' || crit.id === 'kes-sn')) continue
    satisfy(crit.met, plan, c)
  }
  return plan
}

/** Build a complete EncounterLog. `perfect` satisfies every criterion; `average` skips communication and examination; `bad` blames the patient, gives a contraindicated treatment and a wrong plan. */
export function buildScriptedLog(c: Case, kind: ScriptKind): EncounterLog {
  const log = createLog(c.id, 0)
  log.bedAtSec = 0
  const plan = planFor(c, kind)
  let t = 4
  const step = 4

  const say = (text: string, atSec: number) => {
    const { tone, intents } = classifyTone(text)
    log.chat.push({ who: 'you', text, atSec, tone, intents })
    log.chat.push({ who: 'patient', text: '...', atSec })
  }

  if (kind === 'bad') {
    say('Salah sendiri, makanya jangan bandel.', t)
    t += step
    say('Ah masa, jangan banyak alasan.', t)
    t += step
    const distractor = c.dialogue.find((d) => !d.relevant)
    if (distractor) log.askedIds.push({ id: distractor.id, atSec: t, via: 'click' })
    t += step
    const wrongTest = [...c.tests].reverse().find((x) => !c.rubric.criteria.some((cr) => JSON.stringify(cr.met).includes(`"${x.testId}"`)))
    if (wrongTest) log.orders.push({ testId: wrongTest.testId, atSec: t, readyAtSec: t + wrongTest.turnaroundSec, seenAtSec: t + wrongTest.turnaroundSec })
    t += step
    const bad = c.contraindicated[0]
    if (bad) log.treatments.push({ id: bad.id, atSec: t })
    t += step
    log.diagnosisId = c.diagnoses.find((d) => d.id !== c.correctDiagnosisId)?.id ?? null
    log.diagnosisAtSec = t
    log.dispositionId = c.dispositions.find((d) => d.outcome === 'discharged' && d.id !== c.correctDispositionId)?.id ?? c.dispositions.find((d) => d.id !== c.correctDispositionId)?.id ?? null
    log.dispositionAtSec = t + step
    log.endedAtSec = t + step
    if (c.er) {
      log.outcome = 'deceased'
      log.stageTrail.push({ atSec: t, stage: 1 }, { atSec: t + 2, stage: 2 }, { atSec: t + step, stage: 3 })
    } else {
      log.outcome = c.dispositions.find((d) => d.id === log.dispositionId)?.outcome ?? 'discharged'
    }
    log.emotionTrace.push({ atSec: 8, trust: 22, mood: 'sedih', pain: 0.5, patience: 0.5, delta: -10, tone: 'menghakimi' }, { atSec: t, trust: 10, mood: 'marah', pain: 0.6, patience: 0.2, delta: -10, tone: 'menghakimi' })
    return log
  }

  if (c.er && plan.triage) log.triage = { zone: c.er.triage.zone, atSec: t }
  else if (c.er && kind === 'perfect') log.triage = { zone: c.er.triage.zone, atSec: t }
  for (const intent of plan.intents) {
    const phrase = PHRASES[intent]
    if (phrase) {
      say(phrase, t)
      t += step
    }
  }
  for (const id of plan.asked) {
    log.askedIds.push({ id, atSec: t, via: 'click' })
    log.chat.push({ who: 'you', text: c.dialogue.find((d) => d.id === id)?.question ?? id, atSec: t, tone: 'netral', intents: [] })
    t += step
  }
  for (const id of plan.exams) {
    log.exams.push({ id, atSec: t })
    t += step
  }
  for (const id of plan.orders) {
    const test = c.tests.find((x) => x.testId === id)
    const ready = t + (test?.turnaroundSec ?? 0)
    log.orders.push({ testId: id, atSec: t, readyAtSec: ready, seenAtSec: ready })
    t += step
  }
  // critical treatments first so time-boxed criteria hold
  const treatOrder = [...plan.treatments].sort((a, b) => Number(c.criticalTreatmentIds.includes(b)) - Number(c.criticalTreatmentIds.includes(a)))
  for (const id of treatOrder) {
    const def = c.treatments.find((x) => x.id === id)
    log.treatments.push({ id, atSec: t, dose: def?.defaultDose, duration: def?.defaultDuration })
    t += step
  }
  if (plan.diagnosis) {
    log.diagnosisId = plan.diagnosis
    log.diagnosisAtSec = t
    t += step
  }
  if (plan.disposition) {
    log.dispositionId = plan.disposition
    log.dispositionAtSec = t
    log.outcome = c.dispositions.find((d) => d.id === plan.disposition)?.outcome ?? 'discharged'
  }
  log.checklist = { sum: false, safe: false, ice: false, ...plan.checklist }
  log.endedAtSec = t
  const finalTrust = kind === 'perfect' ? 86 : 64
  log.emotionTrace.push(
    { atSec: 4, trust: c.initialTrust, mood: 'netral', pain: 0.4, patience: 1, delta: 0 },
    { atSec: t, trust: finalTrust, mood: kind === 'perfect' ? 'senang' : 'netral', pain: 0.2, patience: 0.8, delta: finalTrust - c.initialTrust },
  )
  return log
}
