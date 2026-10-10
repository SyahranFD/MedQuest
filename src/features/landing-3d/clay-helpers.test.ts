import { CLAY_FALLBACK } from '@/lib/clay-palette'
import { DPR_MAX, QUALITY_PROFILES, TRIANGLES_PER_OBJECT, clampDpr, countTriangles, qualityForWidth, seg, withinBudget } from './budget'
import { FLOAT_LIMITS, floatOffset, floatParams } from './float'
import { buildClayObject } from './objects/builders'
import { CLAY_OBJECT_NAMES } from './objects/names'
import { criticalSpringStep } from './spring'

describe('floatParams', () => {
  it('is deterministic for a seed and index', () => {
    expect(floatParams(3, 1)).toEqual(floatParams(3, 1))
    expect(floatParams(3, 1)).not.toEqual(floatParams(4, 1))
    expect(floatParams(3, 1)).not.toEqual(floatParams(3, 2))
  })

  it('stays inside the E2 limits for many seeds', () => {
    for (let seed = 0; seed < 200; seed++) {
      const p = floatParams(seed, seed % 11)
      expect(p.amplitudePx).toBeLessThanOrEqual(FLOAT_LIMITS.maxAmplitudePx)
      expect(p.periodS).toBeGreaterThanOrEqual(FLOAT_LIMITS.minPeriodS)
      expect(p.tiltDeg).toBeLessThanOrEqual(FLOAT_LIMITS.maxTiltDeg)
      for (let t = 0; t < 30; t += 0.37) {
        expect(Math.abs(floatOffset(p, t).y)).toBeLessThanOrEqual(FLOAT_LIMITS.maxAmplitudePx)
      }
    }
  })

  it('does not move before its delay', () => {
    const p = floatParams(9)
    const o = floatOffset(p, 0)
    expect(Math.abs(o.y)).toBe(0)
    expect(Math.abs(o.tilt)).toBe(0)
  })
})

describe('criticalSpringStep', () => {
  it('approaches the target without overshoot and settles', () => {
    let s = { x: 0, v: 0 }
    let max = 0
    for (let i = 0; i < 300; i++) {
      s = criticalSpringStep(s, 1, 11, 1 / 60)
      max = Math.max(max, s.x)
    }
    expect(max).toBeLessThanOrEqual(1 + 1e-9)
    expect(s.x).toBeCloseTo(1, 4)
  })

  it('is continuous when the target changes mid-flight', () => {
    let s = { x: 0, v: 0 }
    for (let i = 0; i < 10; i++) s = criticalSpringStep(s, 1, 11, 1 / 60)
    const before = s.x
    const next = criticalSpringStep(s, -1, 11, 1 / 600)
    expect(Math.abs(next.x - before)).toBeLessThan(0.02)
  })
})

describe('budget helpers', () => {
  it('chooses low quality on narrow screens only', () => {
    expect(qualityForWidth(390)).toBe('low')
    expect(qualityForWidth(1440)).toBe('high')
    expect(qualityForWidth(0)).toBe('high')
  })

  it('clamps segments and dpr', () => {
    expect(seg('high', 20)).toBe(20)
    expect(seg('low', 20)).toBe(12)
    expect(seg('low', 3, 3)).toBe(3)
    expect(clampDpr(3, DPR_MAX)).toBe(DPR_MAX)
    expect(clampDpr(0.5, DPR_MAX)).toBe(1)
    expect(QUALITY_PROFILES.low.heroSatellites).toBeLessThan(QUALITY_PROFILES.high.heroSatellites)
    expect(withinBudget(10, 10)).toBe(true)
    expect(withinBudget(11, 10)).toBe(false)
  })
})

describe('clay objects', () => {
  it.each(CLAY_OBJECT_NAMES)('%s is one merged geometry within the triangle budget', (name) => {
    const high = buildClayObject(name, CLAY_FALLBACK, 'high')
    const low = buildClayObject(name, CLAY_FALLBACK, 'low')
    expect(high.getAttribute('color')).toBeDefined()
    expect(countTriangles(high)).toBeGreaterThan(50)
    expect(withinBudget(countTriangles(high), TRIANGLES_PER_OBJECT)).toBe(true)
    expect(countTriangles(low)).toBeLessThan(countTriangles(high))
  })

  it('applies a main color override', () => {
    const a = buildClayObject('pill', CLAY_FALLBACK, 'low')
    const b = buildClayObject('pill', CLAY_FALLBACK, 'low', 'red')
    expect(Array.from(a.getAttribute('color').array)).not.toEqual(Array.from(b.getAttribute('color').array))
  })
})
