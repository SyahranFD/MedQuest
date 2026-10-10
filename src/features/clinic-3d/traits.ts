import type { PatientVisual } from '@/lib/emotion'

// Deterministic character traits from a seed: same seed, age and gender always give the same
// skin, hair, build, outfit and accessories.

export type HairStyle = 'short' | 'side' | 'long' | 'bun' | 'curly' | 'bald' | 'hijab'
export type Accessory = 'none' | 'glasses' | 'peci' | 'plaster'

export interface Traits {
  skinIndex: number
  hairStyle: HairStyle
  hairIndex: number
  hairGray: boolean
  outfitIndex: number
  accessory: Accessory
  /** Torso width multiplier. */
  build: number
  /** Overall height multiplier (age). */
  heightScale: number
  /** Head size multiplier relative to the body. */
  headScale: number
  /** Extra forward stoop for the elderly (adds to slump). */
  stoop: number
}

export function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Small deterministic PRNG (mulberry32). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SKIN_COUNT = 6
export const HAIR_COLOR_COUNT = 5
export const OUTFIT_COUNT = 6

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length]
}

export function deriveTraits(visual: Pick<PatientVisual, 'seed' | 'age' | 'gender'>): Traits {
  const rng = makeRng(hashSeed(`${visual.seed}|${visual.gender}`))
  const { age, gender } = visual
  const child = age < 13
  const elder = age >= 60

  const skinIndex = Math.floor(rng() * SKIN_COUNT)
  const hairIndex = Math.floor(rng() * HAIR_COLOR_COUNT)
  const outfitIndex = Math.floor(rng() * OUTFIT_COUNT)
  const gray = elder ? rng() < 0.85 : age >= 45 && rng() < 0.35

  let hairStyle: HairStyle
  if (gender === 'F') {
    hairStyle = child
      ? pick(rng, ['long', 'bun', 'short'] as const)
      : pick(rng, ['long', 'bun', 'hijab', 'side', 'hijab', 'curly'] as const)
  } else {
    hairStyle = pick(rng, ['short', 'side', 'short', 'curly', 'bald'] as const)
    if (elder && rng() < 0.3) hairStyle = 'bald'
  }

  let accessory: Accessory = 'none'
  const roll = rng()
  if (gender === 'M' && elder && roll < 0.3) accessory = 'peci'
  else if (roll < (age >= 40 ? 0.38 : 0.2)) accessory = 'glasses'
  else if (roll > 0.9) accessory = 'plaster'

  const build = (gender === 'F' ? 0.95 : 1.03) * (0.92 + rng() * 0.2)
  const heightScale = child ? 0.64 + age * 0.012 : elder ? 0.94 : 1
  return {
    skinIndex,
    hairStyle,
    hairIndex,
    hairGray: gray,
    outfitIndex,
    accessory,
    build,
    heightScale,
    headScale: child ? 1.12 : 1,
    stoop: elder ? 0.12 : 0,
  }
}

export function traitsKey(traits: Traits): string {
  return JSON.stringify(traits)
}
