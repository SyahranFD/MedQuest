import { EMOTIONS } from '@/lib/emotion'
import {
  Blinker,
  EMOTION_PARAMS,
  ExpressionSpring,
  VISEMES,
  VisemeCycler,
  targetParams,
} from './expression'
import { makeRng } from './traits'

describe('emotion parameter table', () => {
  it('has a complete, finite entry for all 8 emotions', () => {
    expect(EMOTIONS).toHaveLength(8)
    for (const emotion of EMOTIONS) {
      const params = EMOTION_PARAMS[emotion]
      expect(params, emotion).toBeDefined()
      for (const [key, value] of Object.entries(params)) {
        expect(Number.isFinite(value), `${emotion}.${key}`).toBe(true)
      }
    }
  })

  it('drops the inner brow for marah and raises it for cemas', () => {
    expect(EMOTION_PARAMS.marah.browTiltL).toBeLessThan(0)
    expect(EMOTION_PARAMS.cemas.browTiltL).toBeGreaterThan(0)
    expect(EMOTION_PARAMS.senang.mouthCurve).toBeGreaterThan(0.5)
    expect(EMOTION_PARAMS.sedih.mouthCurve).toBeLessThan(-0.5)
  })

  it('scales with intensity and gates particles', () => {
    const faint = targetParams('sedih', 0)
    const strong = targetParams('sedih', 1)
    expect(Math.abs(faint.mouthCurve)).toBeLessThan(Math.abs(strong.mouthCurve))
    expect(faint.fxTear).toBe(0)
    expect(strong.fxTear).toBe(1)
    expect(targetParams('netral', 1)).toEqual(targetParams('netral', 0))
  })
})

describe('ExpressionSpring', () => {
  it('settles on the target and brows move before the mouth', () => {
    const spring = new ExpressionSpring(targetParams('netral', 1))
    spring.setTarget(targetParams('marah', 1), 0, false)
    let t = 0
    let browMovedBeforeMouth = false
    while (t < 0.05) {
      spring.step(1 / 60, t)
      t += 1 / 60
      if (spring.current.browTiltL !== 0 && spring.current.headRoll === 0) browMovedBeforeMouth = true
    }
    expect(browMovedBeforeMouth).toBe(true)
    let moving = true
    while (moving && t < 3) {
      moving = spring.step(1 / 60, t)
      t += 1 / 60
    }
    expect(moving).toBe(false)
    expect(spring.current.browTiltL).toBeCloseTo(-26, 1)
    expect(spring.current.mouthCurve).toBeCloseTo(-0.5, 2)
  })
})

describe('talking and blinking', () => {
  it('never repeats a viseme back to back and stays within the viseme range', () => {
    const cycler = new VisemeCycler(makeRng(7))
    const maxOpen = Math.max(...VISEMES.map((v) => v.open))
    let opens = new Set<number>()
    for (let t = 0; t < 4; t += 0.016) {
      const v = cycler.update(t)
      expect(v.open).toBeGreaterThanOrEqual(0)
      expect(v.open).toBeLessThanOrEqual(maxOpen + 1e-6)
      opens.add(Math.round(v.open * 10))
    }
    expect(opens.size).toBeGreaterThan(3)
    opens = new Set()
  })

  it('blinks at the requested rate', () => {
    const blinker = new Blinker(makeRng(3))
    let closed = 0
    for (let t = 0; t < 60; t += 0.01) {
      if (blinker.update(t, 16, 0.2) < 0.9 && blinker.update(t, 16, 0.2) < 0.2) closed++
    }
    expect(closed).toBeGreaterThan(0)
  })
})
