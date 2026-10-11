// Authoring helpers for case data. They keep the case files declarative and compact.

import { DISPOSITION_CATALOGUE, TEST_CATALOGUE, TREATMENT_CATALOGUE } from './catalogue'
import type {
  CaseTest,
  Criterion,
  Dimension,
  DialogueCategory,
  DialogueEntry,
  DispositionDef,
  ExamFinding,
  ExamSystem,
  Fallbacks,
  Mode,
  Pred,
  Rubric,
  BreachRule,
  TestResultVariant,
  TreatmentDef,
  Vitals,
} from './types'

export function vitals(hr: number, bp: string, rr: number, spo2: number, temp: number, gcs = 15): Vitals {
  const [sbp, dbp] = bp.split('/').map(Number)
  return { hr, sbp, dbp, rr, spo2, temp, gcs }
}

export function formatBp(v: Pick<Vitals, 'sbp' | 'dbp'>) {
  return `${Math.round(v.sbp)}/${Math.round(v.dbp)}`
}

interface EntryOptions {
  /** Distractor question. */
  distractor?: true
  red?: true
  /** [minTrust, gatedAnswer] */
  gate?: [number, string]
}

/** Dialogue entry. `patterns` are AND-groups of words; the question text should match itself. */
export function q(
  id: string,
  category: DialogueCategory,
  question: string,
  answer: string,
  patterns: string[],
  o: EntryOptions = {},
): DialogueEntry {
  return {
    id,
    category,
    question,
    answer,
    patterns,
    relevant: !o.distractor,
    ...(o.red ? { redFlag: true } : {}),
    ...(o.gate ? { minTrust: o.gate[0], gatedAnswer: o.gate[1] } : {}),
  }
}

/** The three ICE questions every case answers (ideas, concerns, expectations). */
export function iceEntries(ideas: string, concerns: string, expectations: string): DialogueEntry[] {
  return [
    q('ice-ideas', 'rps', 'Menurut Anda, apa penyebab keluhan ini?', ideas, [
      'menurut penyebab',
      'dugaan penyebab',
      'apa kira penyebab',
      'apa pikir penyebab',
      'menurut',
    ]),
    q('ice-concerns', 'rps', 'Apa yang paling Anda khawatirkan?', concerns, [
      'apa takut',
      'takut apa',
      'paling takut',
      'mengganggu pikiran',
    ]),
    q('ice-expectations', 'rps', 'Apa harapan Anda dari kunjungan hari ini?', expectations, [
      'harapan',
      'berharap',
      'diharapkan',
      'ingin dilakukan',
      'apa yang diinginkan',
    ]),
  ]
}

export function defaultFallbacks(f: Partial<Fallbacks> = {}): Fallbacks {
  return {
    unclear: [
      'Maaf, Dok, bisa diulang pertanyaannya?',
      'Maksud Dokter bagaimana ya? Saya kurang paham.',
      'Hmm, bisa Dokter jelaskan lagi pertanyaannya?',
    ],
    empathyReply: 'Terima kasih, Dok. Rasanya jadi sedikit lebih tenang.',
    reassureReply: 'Baik, Dok. Saya percaya sama Dokter.',
    repeatPrefix: 'Tadi sudah saya sampaikan, Dok.',
    interruptedReply: 'Sebentar, Dok, saya belum selesai bicara.',
    ...f,
  }
}

export function exam(
  id: string,
  system: ExamSystem,
  label: string,
  finding: string,
  o: { abnormal?: true; distractor?: true } = {},
): ExamFinding {
  return { id, system, label, finding, abnormal: !!o.abnormal, relevant: !o.distractor }
}

type TestSpec = string | [id: string, results: TestResultVariant[], sec?: number]

/** Build the case test list. ER tests take their catalogue turnaround; poli tests are instant. */
export function makeTests(mode: Mode, specs: TestSpec[]): CaseTest[] {
  return specs.map((spec) => {
    const [id, results, sec] = typeof spec === 'string' ? [spec, undefined, undefined] : spec
    const base = TEST_CATALOGUE[id]
    if (!base) throw new Error(`Unknown test id: ${id}`)
    return {
      testId: id,
      name: base.name,
      en: base.en,
      category: base.category,
      turnaroundSec: mode === 'poli' ? 0 : (sec ?? base.baseSec),
      results: results ?? [{ text: base.normalText, abnormal: false }],
    }
  })
}

export function pickTreatments(ids: string[]): TreatmentDef[] {
  return ids.map((id) => {
    const t = TREATMENT_CATALOGUE[id]
    if (!t) throw new Error(`Unknown treatment id: ${id}`)
    return t
  })
}

export function pickDispositions(ids: string[]): DispositionDef[] {
  return ids.map((id) => {
    const d = DISPOSITION_CATALOGUE[id]
    if (!d) throw new Error(`Unknown disposition id: ${id}`)
    return d
  })
}

// ---------- rubric kit ----------

interface CritText {
  met: string
  missed: string
  partial?: string
}

interface CritOptions {
  partial?: Pred
  ref?: string
  improve?: string
  highlight?: string
}

export function crit(
  id: string,
  dimension: Dimension,
  weight: 1 | 2 | 3,
  label: string,
  met: Pred,
  text: CritText,
  o: CritOptions = {},
): Criterion {
  return {
    id,
    dimension,
    weight,
    label,
    met,
    ...(o.partial ? { partial: o.partial } : {}),
    ...(o.ref ? { guidelineRef: o.ref } : {}),
    evidence: { met: text.met, missed: text.missed, ...(text.partial ? { partial: text.partial } : {}) },
    ...(o.improve ? { improvement: o.improve } : {}),
    ...(o.highlight ? { highlight: o.highlight } : {}),
  }
}

const ICE_IDS = ['ice-ideas', 'ice-concerns', 'ice-expectations']

/** Communication criteria shared by every case. */
export function communicationCriteria(): Criterion[] {
  return [
    crit(
      'kom-01',
      'komunikasi',
      1,
      'Menyapa dan memperkenalkan diri',
      { kind: 'all', of: [{ kind: 'intent', intent: 'greet' }, { kind: 'intent', intent: 'intro' }] },
      {
        met: 'Anda menyapa dan memperkenalkan diri.',
        partial: 'Anda menyapa atau memperkenalkan diri, tetapi tidak keduanya.',
        missed: 'Anda tidak menyapa dan memperkenalkan diri.',
      },
      {
        partial: { kind: 'any', of: [{ kind: 'intent', intent: 'greet' }, { kind: 'intent', intent: 'intro' }] },
        improve: 'Mulailah dengan menyapa, lalu sebutkan nama dan peran Anda.',
        highlight: 'Pembukaan konsultasi yang sopan dan jelas.',
      },
    ),
    crit(
      'kom-02',
      'komunikasi',
      1,
      'Meminta izin sebelum memeriksa',
      { kind: 'intent', intent: 'consent' },
      {
        met: 'Anda meminta izin pasien sebelum pemeriksaan.',
        missed: 'Anda tidak meminta izin sebelum memeriksa.',
      },
      {
        improve: 'Minta izin dan jelaskan singkat apa yang akan diperiksa sebelum menyentuh pasien.',
        highlight: 'Anda menghormati hak pasien dengan meminta izin.',
      },
    ),
    crit(
      'kom-03',
      'komunikasi',
      2,
      'Respons empatik',
      { kind: 'intent', intent: 'empathy' },
      {
        met: 'Anda menyampaikan empati dengan jelas.',
        partial: 'Anda menenangkan pasien, tetapi tidak menyebut perasaannya.',
        missed: 'Anda tidak menyampaikan empati.',
      },
      {
        partial: { kind: 'intent', intent: 'reassure' },
        improve: 'Akui perasaan pasien dengan kalimat singkat, misalnya "Saya mengerti ini pasti tidak nyaman".',
        highlight: 'Empati Anda membuat pasien lebih percaya dan terbuka.',
      },
    ),
    crit(
      'kom-04',
      'komunikasi',
      2,
      'Menggali ide, kekhawatiran, dan harapan pasien',
      { kind: 'asked', anyOf: ICE_IDS, min: 2 },
      {
        met: 'Anda menanyakan sudut pandang pasien (ide, kekhawatiran, harapan).',
        partial: 'Anda baru menanyakan sebagian sudut pandang pasien, atau hanya mencentangnya di daftar akhir.',
        missed: 'Anda tidak menanyakan sudut pandang pasien.',
      },
      {
        partial: {
          kind: 'any',
          of: [{ kind: 'asked', anyOf: ICE_IDS, min: 1 }, { kind: 'checklist', key: 'ice' }],
        },
        improve: 'Tanyakan apa yang dipikirkan, dikhawatirkan, dan diharapkan pasien sebelum menjelaskan rencana.',
        highlight: 'Anda menanyakan kekhawatiran dan harapan pasien.',
      },
    ),
    crit(
      'kom-05',
      'komunikasi',
      1,
      'Merangkum dan memastikan pemahaman',
      { kind: 'intent', intent: 'summary' },
      {
        met: 'Anda merangkum cerita pasien.',
        partial: 'Anda mencentang rangkuman di daftar akhir, tetapi tidak ada rangkuman di percakapan.',
        missed: 'Anda tidak merangkum cerita pasien.',
      },
      {
        partial: { kind: 'checklist', key: 'sum' },
        improve: 'Rangkum kembali keluhan pasien sebelum menutup anamnesis.',
        highlight: 'Rangkuman Anda memastikan cerita pasien dipahami dengan benar.',
      },
    ),
    crit(
      'kom-06',
      'komunikasi',
      2,
      'Tidak menghakimi dan tidak menyela',
      {
        kind: 'all',
        of: [
          { kind: 'toneCount', tone: 'menghakimi', max: 0 },
          { kind: 'toneCount', tone: 'menyela', max: 1 },
        ],
      },
      {
        met: 'Nada Anda menghargai pasien.',
        partial: 'Anda tidak menghakimi, tetapi beberapa kali menyela pasien.',
        missed: 'Ada kalimat yang menghakimi, atau Anda terlalu sering menyela.',
      },
      {
        partial: { kind: 'toneCount', tone: 'menghakimi', max: 0 },
        improve: 'Biarkan pasien selesai bicara dan hindari kalimat yang menyalahkan.',
        highlight: 'Anda menjaga nada yang menghargai pasien.',
      },
    ),
  ]
}

/** Safety-netting criterion shared by all cases. Weight is lower in ER. */
export function safetyNetCriterion(weight: 1 | 2, ref?: string): Criterion {
  return crit(
    'kes-sn',
    'keselamatan',
    weight,
    'Edukasi tanda bahaya (safety-netting)',
    { kind: 'intent', intent: 'safety-net' },
    {
      met: 'Anda menjelaskan tanda bahaya dan kapan harus kembali.',
      partial: 'Anda mencentang edukasi tanda bahaya di daftar akhir, tetapi tidak menyampaikannya di percakapan.',
      missed: 'Anda tidak menjelaskan tanda bahaya dan kapan harus kembali.',
    },
    {
      partial: { kind: 'checklist', key: 'safe' },
      ref,
      improve: 'Jelaskan tanda bahaya dan kapan pasien atau keluarga harus segera kembali.',
      highlight: 'Anda memberi edukasi tanda bahaya dengan jelas.',
    },
  )
}

interface RubricParts {
  criteria: Criterion[]
  breaches: BreachRule[]
  teachingPoints: string[]
}

export function buildRubric(p: RubricParts): Rubric {
  return {
    criteria: [...communicationCriteria(), ...p.criteria],
    breaches: p.breaches,
    teachingPoints: p.teachingPoints,
  }
}

export const P = {
  asked: (anyOf: string[], min?: number): Pred => ({ kind: 'asked', anyOf, ...(min ? { min } : {}) }),
  examined: (anyOf: string[], min?: number): Pred => ({ kind: 'examined', anyOf, ...(min ? { min } : {}) }),
  ordered: (anyOf: string[], min?: number): Pred => ({ kind: 'ordered', anyOf, ...(min ? { min } : {}) }),
  treated: (anyOf: string[] | 'indicated' | 'critical' | 'contraindicated', withinSec?: number, min?: number): Pred => ({
    kind: 'treated',
    anyOf,
    ...(withinSec ? { withinSec } : {}),
    ...(min ? { min } : {}),
  }),
  all: (...of: Pred[]): Pred => ({ kind: 'all', of }),
  any: (...of: Pred[]): Pred => ({ kind: 'any', of }),
  not: (of: Pred): Pred => ({ kind: 'not', of }),
  dx: { kind: 'diagnosis', equals: 'correct' } as Pred,
  dispo: { kind: 'disposition', equals: 'correct' } as Pred,
  survived: { kind: 'survived' } as Pred,
}
