import { clamp } from '@/lib/emotion'
import type { Emotion, PatientEmotionState, PatientPose, PatientVisual } from '@/lib/emotion'
import type { Case, DialogueEntry, EmotionAction, Intent, Severity, Tone } from '@/features/cases/types'

// Pure patient emotion model. State is plain data; every function returns a new state.

/** Contract state plus internal drivers. The scene only needs the PatientEmotionState part. */
export interface EmotionState extends PatientEmotionState {
  /** 0 to 1, rises on misunderstandings, decays with time. */
  confusion: number
  /** Seconds of "relieved" feeling left after relief or reassurance. */
  reliefSec: number
  /** Consecutive closed questions asked without any empathic action. */
  closedStreak: number
}

/**
 * Trust deltas (points on 0..100). Tone gives the base; empathic intents add a bonus (capped).
 *
 * | Situation                                      | Delta               |
 * |------------------------------------------------|---------------------|
 * | empatik tone                                   | +4 (+ intent bonus) |
 * | netral                                         | 0                   |
 * | menyela (interrupt)                            | -4                  |
 * | menghakimi (blame, rude)                       | -10                 |
 * | mengabaikan (repeat, dismissive)               | -3                  |
 * | clarification fallback (unclear)               | -0.5                |
 * | 3rd+ closed question in a row, no empathy      | -1 each             |
 * | examine with consent / without consent         | +2 / -1.5           |
 * | helpful treatment / harmful treatment          | +4 / -8             |
 * | waiting (patience < 0.5 while waiting)         | -0.05 per second    |
 */
export const TRUST_DELTAS = {
  tone: { empatik: 4, netral: 0, menyela: -4, menghakimi: -10, mengabaikan: -3 } satisfies Record<Tone, number>,
  intentBonus: {
    empathy: 3,
    reassure: 2,
    'ice-ideas': 2,
    'ice-concerns': 2,
    'ice-expectations': 2,
    consent: 2,
    intro: 2,
    greet: 1,
    agenda: 1,
    summary: 1,
    'safety-net': 1,
    'plain-language': 1,
  } satisfies Record<Intent, number>,
  intentBonusCap: 4,
  unclear: -0.5,
  closedStreakThreshold: 3,
  closedStreakPenalty: -1,
  examineConsent: 2,
  examineNoConsent: -1.5,
  treatHelpful: 4,
  treatHarmful: -8,
  waitPerSec: -0.05,
  /** Intents that count as empathy for resetting the closed-question streak. */
  empathicIntents: ['empathy', 'reassure', 'ice-ideas', 'ice-concerns', 'ice-expectations'] as Intent[],
} as const

export const PATIENCE_COSTS = {
  unclear: 0.04,
  menyela: 0.05,
  menghakimi: 0.08,
  mengabaikan: 0.03,
  empatikGain: 0.02,
} as const

const PAIN_BY_SEVERITY: Record<Severity, number> = { critical: 0.75, urgent: 0.45, stable: 0.2 }

export function basePain(severity: Severity) {
  return PAIN_BY_SEVERITY[severity]
}

export function createEmotionState(c: Pick<Case, 'severity' | 'initialTrust'>): EmotionState {
  const base: EmotionState = {
    trust: clamp(c.initialTrust, 0, 100),
    mood: 'netral',
    pain: PAIN_BY_SEVERITY[c.severity],
    patience: 1,
    confusion: 0,
    reliefSec: 0,
    closedStreak: 0,
  }
  return { ...base, mood: deriveMood(base, c.severity) }
}

// ---------- mood ----------

interface MoodRule {
  mood: Emotion
  enter: (s: EmotionState, sev: Severity) => boolean
  stay: (s: EmotionState, sev: Severity) => boolean
}

// Priority order: first rule whose enter() holds wins, unless the current mood's stay() still holds
// and no higher-priority rule enters (hysteresis: enter thresholds are stricter than stay thresholds).
const RULES: MoodRule[] = [
  {
    mood: 'marah',
    enter: (s) => (s.trust < 25 && s.patience < 0.45) || s.trust < 10,
    stay: (s) => (s.trust < 35 && s.patience < 0.55) || s.trust < 15,
  },
  { mood: 'sakit', enter: (s) => s.pain >= 0.65, stay: (s) => s.pain >= 0.5 },
  {
    mood: 'cemas',
    enter: (s, sev) => (sev !== 'stable' && s.pain >= 0.35 && s.trust < 70) || s.patience < 0.35,
    stay: (s, sev) => (sev !== 'stable' && s.pain >= 0.28 && s.trust < 78) || s.patience < 0.45,
  },
  { mood: 'sedih', enter: (s) => s.trust < 35 && s.patience >= 0.45, stay: (s) => s.trust < 45 },
  { mood: 'bingung', enter: (s) => s.confusion >= 0.5, stay: (s) => s.confusion >= 0.2 },
  { mood: 'senang', enter: (s) => s.trust >= 80 && s.pain < 0.3, stay: (s) => s.trust >= 70 && s.pain < 0.4 },
  { mood: 'lega', enter: (s) => s.reliefSec > 0 && s.pain < 0.5 && s.trust >= 55, stay: (s) => s.reliefSec > 0 && s.pain < 0.6 },
]

export function deriveMood(
  state: Pick<EmotionState, 'trust' | 'pain' | 'patience' | 'confusion' | 'reliefSec'>,
  severity: Severity,
  previous: Emotion = 'netral',
): Emotion {
  const s = state as EmotionState
  const prevIdx = RULES.findIndex((r) => r.mood === previous)
  for (let i = 0; i < RULES.length; i++) {
    if (RULES[i].enter(s, severity)) return RULES[i].mood
    // current mood sits at this priority level and still holds: keep it
    if (i === prevIdx && RULES[i].stay(s, severity)) return previous
  }
  return 'netral'
}

// ---------- actions ----------

export interface ApplyResult {
  state: EmotionState
  trustDelta: number
  moodChanged: boolean
}

export function trustDeltaFor(action: EmotionAction, state: Pick<EmotionState, 'closedStreak'>) {
  let delta = 0
  const isEmpathic = action.intents.some((i) => TRUST_DELTAS.empathicIntents.includes(i))
  if (action.kind === 'examine') {
    delta = action.consent ? TRUST_DELTAS.examineConsent : TRUST_DELTAS.examineNoConsent
  } else if (action.kind === 'treat') {
    delta = action.harmful ? TRUST_DELTAS.treatHarmful : action.helpful ? TRUST_DELTAS.treatHelpful : 0
  } else {
    delta = TRUST_DELTAS.tone[action.tone]
    if (action.tone === 'empatik') {
      const bonus = action.intents.reduce((sum, i) => sum + TRUST_DELTAS.intentBonus[i], 0)
      delta += Math.min(bonus, TRUST_DELTAS.intentBonusCap)
    }
    if (action.outcome === 'unclear') delta += TRUST_DELTAS.unclear
    if (action.closed && action.tone === 'netral' && !isEmpathic) {
      if (state.closedStreak + 1 >= TRUST_DELTAS.closedStreakThreshold) delta += TRUST_DELTAS.closedStreakPenalty
    }
  }
  return delta
}

export function applyAction(
  state: EmotionState,
  action: EmotionAction,
  caseDef: Pick<Case, 'severity'>,
): ApplyResult {
  const trustDelta = trustDeltaFor(action, state)
  const isEmpathic = action.intents.some((i) => TRUST_DELTAS.empathicIntents.includes(i))

  let patience = state.patience
  if (action.outcome === 'unclear') patience -= PATIENCE_COSTS.unclear
  if (action.tone === 'menyela') patience -= PATIENCE_COSTS.menyela
  else if (action.tone === 'menghakimi') patience -= PATIENCE_COSTS.menghakimi
  else if (action.tone === 'mengabaikan') patience -= PATIENCE_COSTS.mengabaikan
  else if (action.tone === 'empatik') patience += PATIENCE_COSTS.empatikGain

  let closedStreak = state.closedStreak
  if (isEmpathic) closedStreak = 0
  else if (action.kind !== 'examine' && action.kind !== 'treat' && action.closed) closedStreak += 1

  let pain = state.pain
  let reliefSec = state.reliefSec
  if (action.kind === 'treat' && action.reliefPain) {
    pain = pain * (1 - clamp(action.reliefPain, 0, 1))
    reliefSec = 45
  }
  if (action.intents.includes('empathy') || action.intents.includes('reassure')) {
    reliefSec = Math.max(reliefSec, 15)
  }
  if (action.kind === 'treat' && action.helpful) reliefSec = Math.max(reliefSec, 20)

  const confusion = action.outcome === 'unclear' ? clamp(state.confusion + 0.35, 0, 1) : state.confusion * 0.5

  const next: EmotionState = {
    trust: clamp(state.trust + trustDelta, 0, 100),
    mood: state.mood,
    pain: clamp(pain, 0, 1),
    patience: clamp(patience, 0, 1),
    confusion,
    reliefSec,
    closedStreak,
  }
  next.mood = deriveMood(next, caseDef.severity, state.mood)
  return { state: next, trustDelta, moodChanged: next.mood !== state.mood }
}

// ---------- time ----------

export interface TickContext {
  severity: Severity
  /** Patient has not been seen yet (triage queue). */
  waiting: boolean
  /** Pain the patient is heading towards (rises with deterioration, falls with relief). Defaults to the severity base. */
  painTarget?: number
}

export function tick(state: EmotionState, dtSeconds: number, ctx: TickContext): EmotionState {
  if (dtSeconds <= 0) return state
  const sevFactor = ctx.severity === 'critical' ? 1.5 : ctx.severity === 'urgent' ? 1.2 : 1
  const rate = (ctx.waiting ? 1 / 150 : 1 / 900) * sevFactor * (1 + state.pain * 0.5)
  const patience = clamp(state.patience - rate * dtSeconds, 0, 1)

  const target = clamp(ctx.painTarget ?? PAIN_BY_SEVERITY[ctx.severity], 0, 1)
  const step = 0.03 * dtSeconds
  const pain = clamp(state.pain + clamp(target - state.pain, -step, step), 0, 1)

  let trust = state.trust
  if (ctx.waiting && patience < 0.5) trust += TRUST_DELTAS.waitPerSec * dtSeconds
  else if (patience < 0.2) trust += TRUST_DELTAS.waitPerSec * 0.6 * dtSeconds

  const next: EmotionState = {
    trust: clamp(trust, 0, 100),
    mood: state.mood,
    pain,
    patience,
    confusion: clamp(state.confusion - 0.05 * dtSeconds, 0, 1),
    reliefSec: Math.max(0, state.reliefSec - dtSeconds),
    closedStreak: state.closedStreak,
  }
  next.mood = deriveMood(next, ctx.severity, state.mood)
  return next
}

// ---------- gating ----------

/** True when the patient will not share this answer yet. */
export function withholds(state: Pick<EmotionState, 'trust'>, entry: Pick<DialogueEntry, 'minTrust'>) {
  return entry.minTrust !== undefined && state.trust < entry.minTrust
}

// ---------- visual ----------

export interface VisualInput {
  seed: string
  age: number
  gender: 'M' | 'F'
  talking: boolean
  pose?: PatientPose
}

/** How strongly the current mood is expressed, 0.2 (barely) to 1. */
export function moodIntensity(state: EmotionState): number {
  const v = (() => {
    switch (state.mood) {
      case 'sakit':
        return state.pain
      case 'marah':
        return 1 - state.trust / 100
      case 'cemas':
        return Math.max(1 - state.patience, state.pain)
      case 'sedih':
        return (45 - state.trust) / 45
      case 'bingung':
        return state.confusion + 0.2
      case 'senang':
        return (state.trust - 60) / 40
      case 'lega':
        return 0.4 + state.reliefSec / 60
      default:
        return 0.2
    }
  })()
  return clamp(v, 0.2, 1)
}

export function toVisual(state: EmotionState, input: VisualInput): PatientVisual {
  return {
    seed: input.seed,
    age: input.age,
    gender: input.gender,
    emotion: state.mood,
    intensity: moodIntensity(state),
    talking: input.talking,
    pose: input.pose ?? 'sitting',
  }
}
