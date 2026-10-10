// Domain types for MedQuest cases, grading and live sessions. Pure data, no behavior.
// Clinical text is Indonesian; `en` exists only where a short UI label needs it.
// All case content is SYNTHETIC. A medical consultant must validate it before any real use.

export type Mode = 'er' | 'poli'
export type Severity = 'critical' | 'urgent' | 'stable'
export type Zone = 'red' | 'yellow' | 'green'
export type Difficulty = 'mudah' | 'sedang' | 'sulit'

export interface Label {
  id: string
  en?: string
}

// ---------- communication ----------

export type Tone = 'empatik' | 'netral' | 'menyela' | 'menghakimi' | 'mengabaikan'

export type Intent =
  | 'greet'
  | 'intro'
  | 'consent'
  | 'agenda'
  | 'ice-ideas'
  | 'ice-concerns'
  | 'ice-expectations'
  | 'empathy'
  | 'reassure'
  | 'summary'
  | 'safety-net'
  | 'plain-language'

/** What one student action means to the patient's emotion state. Produced by the dialogue engine. */
export interface EmotionAction {
  kind: 'ask' | 'chat' | 'examine' | 'treat'
  tone: Tone
  intents: Intent[]
  /** ask/chat only: how the patient could respond. */
  outcome?: 'answered' | 'withheld' | 'unclear' | 'social'
  /** A yes/no question ("apakah ...?"). */
  closed?: boolean
  /** examine only: consent was asked earlier in the encounter. */
  consent?: boolean
  /** treat only. */
  helpful?: boolean
  harmful?: boolean
  /** treat only: 0 to 1 pain relief. */
  reliefPain?: number
}

// ---------- dialogue ----------

export type DialogueCategory = 'rps' | 'rpd' | 'keluarga' | 'alergi' | 'obat' | 'sosial'
export const DIALOGUE_CATEGORIES: readonly DialogueCategory[] = [
  'rps',
  'rpd',
  'keluarga',
  'alergi',
  'obat',
  'sosial',
]

export const CATEGORY_LABELS: Record<DialogueCategory, Label & { id: string }> = {
  rps: { id: 'Riwayat penyakit sekarang', en: 'Present illness' },
  rpd: { id: 'Riwayat penyakit dahulu', en: 'Past history' },
  keluarga: { id: 'Riwayat keluarga', en: 'Family history' },
  alergi: { id: 'Alergi', en: 'Allergies' },
  obat: { id: 'Obat yang dikonsumsi', en: 'Medications' },
  sosial: { id: 'Riwayat sosial', en: 'Social history' },
}

export interface DialogueEntry {
  id: string
  category: DialogueCategory
  /** Clickable question text. Must itself match this entry's patterns (enforced by tests). */
  question: string
  /** Patient reply, first person, Indonesian. */
  answer: string
  /**
   * Each pattern is an AND-group of words (any order, stemmed, synonym-aware). Entries match when
   * any pattern is fully matched. Longer patterns score higher.
   */
  patterns: string[]
  /** False for distractor questions. */
  relevant: boolean
  /** Red-flag screening question. */
  redFlag?: boolean
  /** Trust gate: below this trust the patient gives `gatedAnswer` instead. */
  minTrust?: number
  gatedAnswer?: string
}

export interface Fallbacks {
  unclear: string[]
  empathyReply: string
  reassureReply: string
  repeatPrefix: string
  interruptedReply: string
}

// ---------- clinical findings ----------

export interface Vitals {
  hr: number
  sbp: number
  dbp: number
  rr: number
  spo2: number
  temp: number
  gcs: number
}

export type ExamSystem =
  | 'umum'
  | 'kepala-leher'
  | 'thorax'
  | 'jantung'
  | 'paru'
  | 'abdomen'
  | 'ekstremitas'
  | 'kulit'
  | 'neurologi'

export const EXAM_SYSTEM_LABELS: Record<ExamSystem, Label> = {
  umum: { id: 'Keadaan umum', en: 'General' },
  'kepala-leher': { id: 'Kepala dan leher', en: 'Head and neck' },
  thorax: { id: 'Thorax', en: 'Thorax' },
  jantung: { id: 'Jantung', en: 'Heart' },
  paru: { id: 'Paru', en: 'Lungs' },
  abdomen: { id: 'Abdomen', en: 'Abdomen' },
  ekstremitas: { id: 'Ekstremitas', en: 'Extremities' },
  kulit: { id: 'Kulit', en: 'Skin' },
  neurologi: { id: 'Neurologi', en: 'Neurology' },
}

export interface ExamFinding {
  id: string
  system: ExamSystem
  label: string
  finding: string
  abnormal: boolean
  relevant: boolean
}

export type TestCategory = 'bedside' | 'lab' | 'imaging'

export interface TestResultVariant {
  text: string
  abnormal: boolean
  critical?: boolean
  /** Procedural image id for imaging/ECG results (rendered by the UI, no real images). */
  imageId?: string
  /** Variant applies only when the patient is at or past this deterioration stage. */
  minStage?: number
  /** Variant applies only after any of these treatments were given. */
  afterTreatment?: string[]
}

export interface CaseTest {
  testId: string
  name: string
  en?: string
  category: TestCategory
  /** ER: 15 to 90 simulated seconds. Poli: 0 (instant). */
  turnaroundSec: number
  /** First matching variant wins; the last one must have no condition. */
  results: TestResultVariant[]
}

export interface TestPanel {
  id: string
  label: string
  testIds: string[]
}

export interface DiagnosisOption {
  id: string
  label: string
}

export interface TreatmentDef {
  id: string
  name: string
  en?: string
  category: 'obat' | 'tindakan'
  form?: string
  defaultDose?: string
  defaultDuration?: string
}

export interface DispositionDef {
  id: string
  name: string
  en?: string
  outcome: 'discharged' | 'admitted' | 'transferred'
}

// ---------- ER dynamics ----------

export interface DeteriorationStage {
  stage: 1 | 2 | 3
  /** Seconds of exposure (full speed in bed, half speed while waiting). */
  atSec: number
  vitalsDelta: Partial<Vitals>
  /** Toast / bedside line, Indonesian. */
  line: string
  /** Any of these treatments given before the stage fires cancels it. */
  averted: string[]
}

export interface TreatmentEffect {
  treatmentId: string
  vitalsDelta?: Partial<Vitals>
  /** Pushes the patient to the next stage. */
  harmful?: boolean
  /** Steps the patient back one stage once. */
  improves?: boolean
  /** Fraction of pain relieved, 0 to 1. */
  reliefPain?: number
}

export interface ErScript {
  arrivalSec: number
  triage: { esi: 1 | 2 | 3 | 4 | 5; zone: Zone; reason: string }
  timeline: DeteriorationStage[]
  effects: TreatmentEffect[]
  /** Critical treatment should be given within this many seconds of being placed in a bed. */
  criticalDeadlineSec: number
}

// ---------- rubric ----------

export type Dimension =
  | 'komunikasi'
  | 'anamnesis'
  | 'pemeriksaan'
  | 'penalaran'
  | 'terapi'
  | 'keselamatan'

export const DIMENSIONS: readonly Dimension[] = [
  'komunikasi',
  'anamnesis',
  'pemeriksaan',
  'penalaran',
  'terapi',
  'keselamatan',
]

export const DIMENSION_LABELS: Record<Dimension, Label> = {
  komunikasi: { id: 'Komunikasi', en: 'Communication' },
  anamnesis: { id: 'Anamnesis', en: 'History taking' },
  pemeriksaan: { id: 'Pemeriksaan', en: 'Examination' },
  penalaran: { id: 'Penalaran klinis', en: 'Clinical reasoning' },
  terapi: { id: 'Terapi', en: 'Management' },
  keselamatan: { id: 'Keselamatan pasien', en: 'Patient safety' },
}

export type Band = 'clear-fail' | 'borderline' | 'pass' | 'good' | 'excellent'
export type Verdict = 'met' | 'partially-met' | 'missed'

/** Declarative predicate over an EncounterLog. Serializable, no functions. */
export type Pred =
  | { kind: 'asked'; anyOf: string[]; min?: number }
  | { kind: 'examined'; anyOf: string[]; min?: number }
  | { kind: 'ordered'; anyOf: string[]; min?: number }
  | { kind: 'orderedBefore'; first: string; then: string }
  | { kind: 'seenResult'; anyOf: string[] }
  | { kind: 'diagnosis'; equals: 'correct' | string }
  | {
      kind: 'treated'
      anyOf: string[] | 'indicated' | 'critical' | 'contraindicated'
      min?: number
      /** Seconds from bed placement (ER) or encounter start (poli). */
      withinSec?: number
    }
  | { kind: 'disposition'; equals: 'correct' | string }
  | { kind: 'intent'; intent: Intent; min?: number }
  | { kind: 'checklist'; key: 'sum' | 'safe' | 'ice' }
  | { kind: 'survived' }
  | { kind: 'triage'; equals: 'correct' }
  | { kind: 'trustAtLeast'; value: number }
  | { kind: 'toneCount'; tone: Tone; max: number }
  | { kind: 'all'; of: Pred[] }
  | { kind: 'any'; of: Pred[] }
  | { kind: 'not'; of: Pred }

export interface Criterion {
  id: string
  dimension: Dimension
  label: string
  weight: 1 | 2 | 3
  met: Pred
  partial?: Pred
  /** Registry id from features/grading/guidelines. */
  guidelineRef?: string
  evidence: { met: string; partial?: string; missed: string }
  improvement?: string
  highlight?: string
}

export interface BreachRule {
  id: string
  when: Pred
  what: string
  guidelineRef?: string
}

export interface Rubric {
  criteria: Criterion[]
  breaches: BreachRule[]
  /** Teaching points appended to the narrative. */
  teachingPoints: string[]
}

// ---------- case ----------

export interface Patient {
  name: string
  age: number
  gender: 'M' | 'F'
  occupation: string
}

export interface Case {
  id: string
  mode: Mode
  specialty: string
  difficulty: Difficulty
  synthetic: true
  severity: Severity
  /** Short card title, for example "Demam berdarah dengan syok". */
  title: string
  patient: Patient
  arrivalBlurb: string
  chiefComplaint: string
  vitals: Vitals
  /** 0 to 100 starting trust. */
  initialTrust: number
  greeting: string
  farewell: string
  fallbacks: Fallbacks
  dialogue: DialogueEntry[]
  exam: ExamFinding[]
  tests: CaseTest[]
  panels: TestPanel[]
  diagnoses: DiagnosisOption[]
  correctDiagnosisId: string
  differentialIds: string[]
  /** Treatments (ER) and prescriptions (poli) offered for this case. */
  treatments: TreatmentDef[]
  indicatedTreatmentIds: string[]
  criticalTreatmentIds: string[]
  contraindicated: { id: string; reason: string }[]
  dispositions: DispositionDef[]
  correctDispositionId: string
  acceptableDispositionIds: string[]
  er?: ErScript
  rubric: Rubric
  /** Registry ids supporting this case. */
  guidelineIds: string[]
}

// ---------- encounter log ----------

export interface EmotionTracePoint {
  atSec: number
  trust: number
  mood: string
  pain: number
  patience: number
  delta: number
  tone?: Tone
}

export interface EncounterLog {
  caseId: string
  startedAtSec: number
  bedAtSec?: number
  endedAtSec?: number
  triage?: { zone: Zone; atSec: number }
  askedIds: { id: string; atSec: number; via: 'click' | 'chat' }[]
  chat: { who: 'you' | 'patient'; text: string; atSec: number; tone?: Tone; intents?: Intent[] }[]
  exams: { id: string; atSec: number }[]
  orders: { testId: string; atSec: number; readyAtSec: number; seenAtSec?: number }[]
  treatments: { id: string; atSec: number; dose?: string; duration?: string }[]
  diagnosisId: string | null
  diagnosisAtSec?: number
  dispositionId: string | null
  dispositionAtSec?: number
  checklist: { sum: boolean; safe: boolean; ice: boolean }
  emotionTrace: EmotionTracePoint[]
  stageTrail: { atSec: number; stage: number }[]
  outcome: 'discharged' | 'admitted' | 'transferred' | 'deceased' | 'unfinished'
}

// ---------- evaluation ----------

export interface Citation {
  id: string
  title: string
  issuer: string
  year?: number
}

export interface CriterionResult {
  id: string
  dimension: Dimension
  label: string
  weight: number
  verdict: Verdict
  evidence: string
  cite?: Citation
}

export interface DimensionScore {
  raw: number
  max: number
  percent: number
  band: Band
}

export interface TimelineItem {
  atSec: number
  kind: 'ask' | 'exam' | 'test' | 'result' | 'treat' | 'dx' | 'dispo' | 'stage' | 'triage' | 'chat'
  label: string
}

export interface Evaluation {
  caseId: string
  caseTitle: string
  mode: Mode
  band: Band
  headline: string
  percent: number
  dimensions: Record<Dimension, DimensionScore>
  criteria: CriterionResult[]
  breaches: { id: string; what: string; cite?: Citation }[]
  /** True when a safety breach or death capped the rating. */
  capped: boolean
  highlights: string[]
  improvements: string[]
  narrative: string
  /** 0 to 100, from the emotion trace. */
  empathyScore: number
  timeline: TimelineItem[]
  teachingPoints: string[]
  synthetic: true
}
