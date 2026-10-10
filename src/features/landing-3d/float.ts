/** Idle float limits from CLAUDE.md 8.3 exception E2. */
export const FLOAT_LIMITS = { maxAmplitudePx: 6, minPeriodS: 4, maxTiltDeg: 1.2 } as const

export interface FloatParams {
  amplitudePx: number
  periodS: number
  phase: number
  tiltDeg: number
  delayS: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Deterministic per-object float parameters: same seed and index always give the same motion. */
export function floatParams(seed: number, index = 0): FloatParams {
  const rand = mulberry32((seed * 7919 + index * 104729 + 1) | 0)
  return {
    amplitudePx: lerp(3, FLOAT_LIMITS.maxAmplitudePx, rand()),
    periodS: lerp(FLOAT_LIMITS.minPeriodS, 6.5, rand()),
    phase: rand() * Math.PI * 2,
    tiltDeg: lerp(0.4, FLOAT_LIMITS.maxTiltDeg, rand()),
    delayS: rand() * 1.6,
  }
}

const smooth = (x: number) => x * x * (3 - 2 * x)

/** Vertical offset in px and tilt in degrees at time t (seconds). Eases in after the delay. */
export function floatOffset(p: FloatParams, t: number): { y: number; tilt: number } {
  const local = Math.max(0, t - p.delayS)
  const ramp = smooth(Math.min(1, local / 1.2))
  const angle = (Math.PI * 2 * local) / p.periodS + p.phase
  return { y: Math.sin(angle) * p.amplitudePx * ramp, tilt: Math.sin(angle * 0.5 + 1.3) * p.tiltDeg * ramp }
}
