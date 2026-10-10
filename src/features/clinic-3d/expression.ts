import { clamp, EMOTIONS, type Emotion } from '@/lib/emotion'

// Pure expression logic (no three.js): emotion parameter table, intensity blending, spring
// transitions with per-group delays, blink scheduling and the 3-viseme talking cycle.
// Spec: design/analysis/characters-clay-teak.md A3 and A4.

export interface ExpressionParams {
  /** Degrees. Positive raises the inner end (worried), negative drops it (angry). */
  browTiltL: number
  browTiltR: number
  /** Head units above the eye line. */
  browHeightL: number
  browHeightR: number
  /** Brow bar thickness multiplier. */
  browThick: number
  /** -1 frown to +1 smile. */
  mouthCurve: number
  /** 0 line to 1 open. */
  mouthOpen: number
  /** Sideways skew in head units (negative is left). */
  mouthSkew: number
  /** Degrees of head roll. */
  headRoll: number
  /** Head pushed forward in head units (marah). */
  headForward: number
  /** 0 to 1: torso pitch forward and shoulder drop. */
  slump: number
  blinkPerMin: number
  /** Seconds a blink lasts: heavy blinks for sakit. */
  blinkSlow: number
  eyeScaleY: number
  blush: number
  /** 0 to 1 lerp of the skin towards a pale green. */
  sickTint: number
  /** Seconds per breath. */
  breathPeriod: number
  breathAmp: number
  /** Head units of shake (cemas). */
  tremble: number
  fxSweat: number
  fxTear: number
  fxPuff: number
  fxQuestion: number
  fxVein: number
  fxRing: number
}

export type ExpressionKey = keyof ExpressionParams

/** Neutral keeps a faint upturn so a resting face is not read as annoyed. */
const NEUTRAL: ExpressionParams = {
  browTiltL: 0,
  browTiltR: 0,
  browHeightL: 0.15,
  browHeightR: 0.15,
  browThick: 1,
  mouthCurve: 0.12,
  mouthOpen: 0,
  mouthSkew: 0,
  headRoll: 0,
  headForward: 0,
  slump: 0.1,
  blinkPerMin: 16,
  blinkSlow: 0.2,
  eyeScaleY: 1,
  blush: 0,
  sickTint: 0,
  breathPeriod: 4.2,
  breathAmp: 0.015,
  tremble: 0,
  fxSweat: 0,
  fxTear: 0,
  fxPuff: 0,
  fxQuestion: 0,
  fxVein: 0,
  fxRing: 0,
}

function make(overrides: Partial<ExpressionParams>): ExpressionParams {
  return { ...NEUTRAL, ...overrides }
}

/** The 8 emotions as numeric targets (A3 table). Completeness is enforced by the Record type. */
export const EMOTION_PARAMS: Record<Emotion, ExpressionParams> = {
  netral: make({}),
  cemas: make({
    browTiltL: 26,
    browTiltR: 26,
    browHeightL: 0.24,
    browHeightR: 0.24,
    mouthCurve: -0.4,
    mouthOpen: 0.2,
    headRoll: 3,
    slump: 0.25,
    blinkPerMin: 26,
    breathPeriod: 2.6,
    tremble: 0.004,
    fxSweat: 1,
  }),
  sakit: make({
    browTiltL: 16,
    browTiltR: 16,
    browHeightL: 0.1,
    browHeightR: 0.1,
    mouthCurve: -0.4,
    mouthOpen: 0.3,
    headRoll: -6,
    slump: 0.6,
    blinkPerMin: 10,
    blinkSlow: 0.45,
    eyeScaleY: 0.55,
    sickTint: 0.22,
    breathPeriod: 5.5,
    breathAmp: 0.025,
  }),
  sedih: make({
    browTiltL: 24,
    browTiltR: 24,
    browHeightL: 0.12,
    browHeightR: 0.12,
    mouthCurve: -0.7,
    mouthOpen: 0.05,
    headRoll: -8,
    slump: 0.5,
    blinkPerMin: 12,
    eyeScaleY: 0.8,
    fxTear: 1,
  }),
  marah: make({
    browTiltL: -26,
    browTiltR: -26,
    browHeightL: 0.06,
    browHeightR: 0.06,
    browThick: 1.2,
    mouthCurve: -0.5,
    mouthOpen: 0.35,
    headForward: 0.03,
    slump: 0,
    blinkPerMin: 8,
    blush: 0.5,
    breathPeriod: 2.6,
    fxVein: 1,
  }),
  bingung: make({
    browTiltL: 16,
    browTiltR: -14,
    browHeightL: 0.27,
    browHeightR: 0.1,
    mouthCurve: -0.15,
    mouthOpen: 0.12,
    mouthSkew: -0.11,
    headRoll: 11,
    slump: 0.15,
    blinkPerMin: 20,
    fxQuestion: 1,
  }),
  lega: make({
    browTiltL: 8,
    browTiltR: 8,
    browHeightL: 0.17,
    browHeightR: 0.17,
    mouthCurve: 0.55,
    mouthOpen: 0.15,
    headRoll: 2,
    slump: 0.05,
    blinkPerMin: 14,
    eyeScaleY: 0.75,
    fxPuff: 1,
  }),
  senang: make({
    browTiltL: 4,
    browTiltR: 4,
    browHeightL: 0.22,
    browHeightR: 0.22,
    mouthCurve: 0.85,
    mouthOpen: 0.55,
    headRoll: -3,
    slump: 0,
    blinkPerMin: 14,
    eyeScaleY: 0.7,
    blush: 0.35,
    fxRing: 1,
  }),
}

export const POSITIVE_EMOTIONS: ReadonlySet<Emotion> = new Set<Emotion>(['lega', 'senang'])

const PARAM_KEYS = Object.keys(NEUTRAL) as ExpressionKey[]

const FX_KEYS: readonly ExpressionKey[] = [
  'fxSweat',
  'fxTear',
  'fxPuff',
  'fxQuestion',
  'fxVein',
  'fxRing',
]

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Target parameters for an emotion at a given intensity. Intensity 0 is "barely": a visible hint
 * (20 percent) of the expression. Particles only appear once the expression is clearly felt.
 */
export function targetParams(emotion: Emotion, intensity: number): ExpressionParams {
  const full = EMOTION_PARAMS[emotion]
  const level = clamp(intensity, 0, 1)
  const t = 0.2 + 0.8 * level
  const out = { ...NEUTRAL }
  for (const key of PARAM_KEYS) {
    out[key] = NEUTRAL[key] + (full[key] - NEUTRAL[key]) * t
  }
  const fxGate = smoothstep(0.2, 0.5, level)
  for (const key of FX_KEYS) out[key] = full[key] * fxGate
  return out
}

// --- Spring transitions -------------------------------------------------------------------------

type Group = 'brow' | 'mouth' | 'head' | 'slump' | 'eye' | 'fx' | 'idle'

const GROUP_OF: Record<ExpressionKey, Group> = {
  browTiltL: 'brow',
  browTiltR: 'brow',
  browHeightL: 'brow',
  browHeightR: 'brow',
  browThick: 'brow',
  mouthCurve: 'mouth',
  mouthOpen: 'mouth',
  mouthSkew: 'mouth',
  headRoll: 'head',
  headForward: 'head',
  slump: 'slump',
  blinkPerMin: 'idle',
  blinkSlow: 'idle',
  eyeScaleY: 'eye',
  blush: 'eye',
  sickTint: 'eye',
  breathPeriod: 'idle',
  breathAmp: 'idle',
  tremble: 'idle',
  fxSweat: 'fx',
  fxTear: 'fx',
  fxPuff: 'fx',
  fxQuestion: 'fx',
  fxVein: 'fx',
  fxRing: 'fx',
}

/** Seconds each group waits before it starts moving: brows lead the face (A4). */
export const GROUP_DELAY: Record<Group, number> = {
  brow: 0,
  mouth: 0.06,
  eye: 0.05,
  head: 0.1,
  slump: 0.14,
  fx: 0.28,
  idle: 0,
}

export function groupDelay(key: ExpressionKey): number {
  return GROUP_DELAY[GROUP_OF[key]]
}

const STIFFNESS = 170
const DAMPING_NEGATIVE = 26
const DAMPING_POSITIVE = 17

export class ExpressionSpring {
  readonly current: ExpressionParams
  private velocity: Record<ExpressionKey, number>
  private goal: ExpressionParams
  private startAt: Record<ExpressionKey, number>
  private active: ExpressionParams
  private damping = DAMPING_NEGATIVE
  private stiffness = STIFFNESS

  constructor(initial: ExpressionParams) {
    this.current = { ...initial }
    this.goal = { ...initial }
    this.active = { ...initial }
    this.velocity = Object.fromEntries(PARAM_KEYS.map((k) => [k, 0])) as Record<ExpressionKey, number>
    this.startAt = Object.fromEntries(PARAM_KEYS.map((k) => [k, 0])) as Record<ExpressionKey, number>
  }

  /** `instant` skips delays and overshoot (reduced motion). */
  setTarget(next: ExpressionParams, now: number, positive: boolean, instant = false) {
    this.goal = { ...next }
    this.damping = instant ? 2 * Math.sqrt(400) : positive ? DAMPING_POSITIVE : DAMPING_NEGATIVE
    this.stiffness = instant ? 400 : STIFFNESS
    for (const key of PARAM_KEYS) this.startAt[key] = now + (instant ? 0 : groupDelay(key))
  }

  /** Advance by dt seconds. Returns true while anything is still moving. */
  step(dt: number, now: number): boolean {
    const h = Math.min(dt, 1 / 30)
    let moving = false
    for (const key of PARAM_KEYS) {
      const waiting = now < this.startAt[key]
      if (!waiting) this.active[key] = this.goal[key]
      const target = this.active[key]
      let x = this.current[key]
      let v = this.velocity[key]
      const sub = 2
      for (let i = 0; i < sub; i++) {
        const a = this.stiffness * (target - x) - this.damping * v
        v += (a * h) / sub
        x += (v * h) / sub
      }
      this.current[key] = x
      this.velocity[key] = v
      if (waiting || Math.abs(target - x) > 1e-3 || Math.abs(v) > 1e-2) moving = true
    }
    return moving
  }
}

// --- Blink -------------------------------------------------------------------------------------

export class Blinker {
  private nextAt: number
  private startedAt = -1
  private duration = 0.2
  private pendingDouble = false

  private rng: () => number

  constructor(rng: () => number, now = 0) {
    this.rng = rng
    this.nextAt = now + 1 + rng() * 2
  }

  /** Eye openness multiplier: 1 open, 0.1 closed. */
  update(now: number, perMin: number, duration: number): number {
    if (this.startedAt < 0 && now >= this.nextAt) {
      this.startedAt = now
      this.duration = duration
    }
    if (this.startedAt < 0) return 1
    const t = (now - this.startedAt) / this.duration
    if (t >= 1) {
      this.startedAt = -1
      const mean = 60 / Math.max(perMin, 1)
      if (!this.pendingDouble && this.rng() < 0.15) {
        this.pendingDouble = true
        this.nextAt = now + 0.12
      } else {
        this.pendingDouble = false
        this.nextAt = now + mean * (0.6 + this.rng() * 0.8)
      }
      return 1
    }
    // 45 percent closing, 55 percent opening (90 ms down, 110 ms up at the default 200 ms)
    const down = 0.45
    const k = t < down ? t / down : 1 - (t - down) / (1 - down)
    return 1 - 0.9 * k
  }
}

// --- Visemes -----------------------------------------------------------------------------------

export interface Viseme {
  open: number
  width: number
}

export const VISEMES: readonly Viseme[] = [
  { open: 0, width: 1 },
  { open: 0.35, width: 0.9 },
  { open: 0.8, width: 0.75 },
]

const VISEME_SEQUENCE = [1, 2, 0, 1, 2] as const

export class VisemeCycler {
  private index = 0
  private holdUntil = 0
  private prev = -1
  private fromOpen = 0
  private fromWidth = 1
  private switchedAt = 0
  private target: Viseme = VISEMES[0]

  private rng: () => number

  constructor(rng: () => number) {
    this.rng = rng
  }

  /** Returns the blended viseme at `now`. Holds 90 to 140 ms with a 50 ms ease between. */
  update(now: number): Viseme {
    if (now >= this.holdUntil) {
      let pick: number = VISEME_SEQUENCE[this.index % VISEME_SEQUENCE.length]
      this.index++
      if (this.rng() < 0.05) pick = 0
      if (pick === this.prev) pick = (pick + 1) % VISEMES.length
      const hold = pick === 0 && this.rng() < 0.5 ? 0.16 : 0.09 + this.rng() * 0.05
      this.fromOpen = this.target.open
      this.fromWidth = this.target.width
      this.target = VISEMES[pick]
      this.prev = pick
      this.switchedAt = now
      this.holdUntil = now + hold
    }
    const k = clamp((now - this.switchedAt) / 0.05, 0, 1)
    const e = 1 - (1 - k) * (1 - k)
    return {
      open: this.fromOpen + (this.target.open - this.fromOpen) * e,
      width: this.fromWidth + (this.target.width - this.fromWidth) * e,
    }
  }
}

export function isEmotion(value: string): value is Emotion {
  return (EMOTIONS as readonly string[]).includes(value)
}
