import { describe, expect, it } from 'vitest'
import { EMOTIONS } from '@/lib/emotion'
import type { EmotionAction } from '@/features/cases/types'
import { acsCase } from '@/features/cases/data/acs'
import { tbCase } from '@/features/cases/data/tb'
import { classifyTone } from '@/features/dialogue/tone'
import {
  TRUST_DELTAS,
  applyAction,
  createEmotionState,
  deriveMood,
  moodIntensity,
  tick,
  toVisual,
  trustDeltaFor,
  withholds,
} from './emotion-engine'
import type { EmotionState } from './emotion-engine'

const base = (over: Partial<EmotionState> = {}): EmotionState => ({
  trust: 55,
  mood: 'netral',
  pain: 0.2,
  patience: 1,
  confusion: 0,
  reliefSec: 0,
  closedStreak: 0,
  ...over,
})

const ask = (over: Partial<EmotionAction> = {}): EmotionAction => ({
  kind: 'ask',
  tone: 'netral',
  intents: [],
  outcome: 'answered',
  closed: false,
  ...over,
})

describe('trust deltas', () => {
  it('rewards empathy and punishes rude, interrupting and dismissive actions', () => {
    const empathic = classifyTone('Saya mengerti, ini pasti tidak nyaman. Jangan khawatir, kami akan bantu.')
    expect(trustDeltaFor(ask({ tone: empathic.tone, intents: empathic.intents }), base())).toBe(
      TRUST_DELTAS.tone.empatik + TRUST_DELTAS.intentBonusCap,
    )
    expect(trustDeltaFor(ask({ tone: 'menghakimi' }), base())).toBe(-10)
    expect(trustDeltaFor(ask({ tone: 'menyela' }), base())).toBe(-4)
    expect(trustDeltaFor(ask({ tone: 'mengabaikan' }), base())).toBe(-3)
    expect(trustDeltaFor(ask(), base())).toBe(0)
  })

  it('applies the documented table end to end', () => {
    const c = tbCase
    const s0 = createEmotionState(c)
    const rude = applyAction(s0, ask({ tone: 'menghakimi' }), c)
    expect(rude.trustDelta).toBe(-10)
    expect(rude.state.trust).toBe(s0.trust - 10)
    expect(rude.state.patience).toBeLessThan(s0.patience)
    const kind = applyAction(s0, ask({ tone: 'empatik', intents: ['empathy'] }), c)
    expect(kind.state.trust).toBeGreaterThan(s0.trust)
  })

  it('repeated closed questions without empathy slowly lower trust, and empathy resets it', () => {
    const c = tbCase
    let s = createEmotionState(c)
    const deltas: number[] = []
    for (let i = 0; i < 5; i++) {
      const r = applyAction(s, ask({ closed: true }), c)
      deltas.push(r.trustDelta)
      s = r.state
    }
    expect(deltas).toEqual([0, 0, -1, -1, -1])
    const empathic = applyAction(s, ask({ tone: 'empatik', intents: ['empathy'] }), c)
    expect(empathic.state.closedStreak).toBe(0)
    expect(applyAction(empathic.state, ask({ closed: true }), c).trustDelta).toBe(0)
  })

  it('a clarification fallback costs a little patience and trust, and builds confusion', () => {
    const r = applyAction(base(), ask({ outcome: 'unclear' }), tbCase)
    expect(r.trustDelta).toBe(TRUST_DELTAS.unclear)
    expect(r.state.patience).toBeLessThan(1)
    expect(r.state.confusion).toBeGreaterThan(0.3)
  })

  it('examining with consent helps, without consent hurts; harmful treatment hurts, relief calms pain', () => {
    expect(trustDeltaFor({ kind: 'examine', tone: 'netral', intents: [], consent: true }, base())).toBe(2)
    expect(trustDeltaFor({ kind: 'examine', tone: 'netral', intents: [], consent: false }, base())).toBe(-1.5)
    expect(trustDeltaFor({ kind: 'treat', tone: 'netral', intents: [], harmful: true }, base())).toBe(-8)
    const relief = applyAction(base({ pain: 0.8 }), { kind: 'treat', tone: 'netral', intents: [], helpful: true, reliefPain: 0.5 }, acsCase)
    expect(relief.state.pain).toBeCloseTo(0.4)
    expect(relief.state.reliefSec).toBeGreaterThan(0)
    expect(relief.trustDelta).toBe(4)
  })

  it('clamps trust to 0..100', () => {
    const c = tbCase
    const top = applyAction(base({ trust: 99 }), ask({ tone: 'empatik', intents: ['empathy'] }), c)
    expect(top.state.trust).toBe(100)
    const bottom = applyAction(base({ trust: 3 }), ask({ tone: 'menghakimi' }), c)
    expect(bottom.state.trust).toBe(0)
  })
})

describe('trust gate', () => {
  it('withholds gated answers below the threshold', () => {
    expect(withholds({ trust: 40 }, { minTrust: 58 })).toBe(true)
    expect(withholds({ trust: 58 }, { minTrust: 58 })).toBe(false)
    expect(withholds({ trust: 0 }, {})).toBe(false)
  })
})

describe('tick', () => {
  it('patience decays faster while waiting, and long waits cost trust', () => {
    const s = base({ pain: 0.75 })
    const waiting = tick(s, 60, { severity: 'critical', waiting: true })
    const seen = tick(s, 60, { severity: 'critical', waiting: false })
    expect(waiting.patience).toBeLessThan(seen.patience)
    const longWait = tick(waiting, 60, { severity: 'critical', waiting: true })
    expect(longWait.patience).toBeLessThan(0.5)
    expect(longWait.trust).toBeLessThan(s.trust)
    expect(seen.trust).toBe(s.trust)
  })

  it('pain moves towards the severity target gradually', () => {
    const calm = base({ pain: 0 })
    const after = tick(calm, 5, { severity: 'critical', waiting: false })
    expect(after.pain).toBeGreaterThan(0)
    expect(after.pain).toBeLessThan(0.75)
    expect(tick(calm, 60, { severity: 'critical', waiting: false }).pain).toBeCloseTo(0.75)
    expect(tick(calm, 0, { severity: 'critical', waiting: false })).toBe(calm)
  })

  it('confusion and relief fade', () => {
    const s = tick(base({ confusion: 0.5, reliefSec: 10 }), 6, { severity: 'stable', waiting: false })
    expect(s.confusion).toBeLessThan(0.5)
    expect(s.reliefSec).toBe(4)
  })
})

describe('deriveMood', () => {
  it('maps states to the eight emotions', () => {
    expect(deriveMood(base({ pain: 0.9 }), 'critical')).toBe('sakit')
    expect(deriveMood(base({ trust: 15, patience: 0.2 }), 'urgent')).toBe('marah')
    expect(deriveMood(base({ trust: 30, patience: 0.9 }), 'stable')).toBe('sedih')
    expect(deriveMood(base({ pain: 0.4, trust: 50 }), 'critical')).toBe('cemas')
    expect(deriveMood(base({ confusion: 0.7 }), 'stable')).toBe('bingung')
    expect(deriveMood(base({ trust: 90, pain: 0.1 }), 'stable')).toBe('senang')
    expect(deriveMood(base({ reliefSec: 20, trust: 65, pain: 0.2 }), 'stable')).toBe('lega')
    expect(deriveMood(base(), 'stable')).toBe('netral')
    for (const m of EMOTIONS) expect(EMOTIONS).toContain(m)
  })

  it('has hysteresis: a mood is kept between its enter and stay thresholds', () => {
    const borderline = base({ pain: 0.55 })
    expect(deriveMood(borderline, 'critical', 'netral')).not.toBe('sakit')
    expect(deriveMood(borderline, 'critical', 'sakit')).toBe('sakit')
    expect(deriveMood(base({ pain: 0.35, trust: 85 }), 'stable', 'senang')).toBe('senang')
    expect(deriveMood(base({ pain: 0.35, trust: 75 }), 'stable', 'netral')).toBe('netral')
  })

  it('does not flicker while pain wobbles around the threshold', () => {
    let mood: ReturnType<typeof deriveMood> = 'netral'
    const seen: string[] = []
    for (const pain of [0.6, 0.66, 0.6, 0.55, 0.52, 0.58, 0.64, 0.66, 0.49]) {
      mood = deriveMood(base({ pain }), 'critical', mood)
      seen.push(mood)
    }
    const switches = seen.filter((m, i) => i > 0 && m !== seen[i - 1]).length
    expect(switches).toBeLessThanOrEqual(3)
  })
})

describe('toVisual', () => {
  it('produces a PatientVisual with intensity and caller-supplied talking flag', () => {
    const s = base({ pain: 0.9, mood: 'sakit' })
    const v = toVisual(s, { seed: acsCase.id, age: 58, gender: 'M', talking: true })
    expect(v).toMatchObject({ seed: acsCase.id, age: 58, gender: 'M', emotion: 'sakit', talking: true, pose: 'sitting' })
    expect(v.intensity).toBeCloseTo(0.9)
    expect(toVisual(base(), { seed: 'x', age: 1, gender: 'F', talking: false, pose: 'lying' }).pose).toBe('lying')
    expect(moodIntensity(base())).toBe(0.2)
    expect(moodIntensity(base({ mood: 'marah', trust: 0 }))).toBe(1)
  })
})
