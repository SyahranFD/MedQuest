// Deterministic patient avatar: the same case id always yields the same face. Colors are CSS tokens.

import { hashString } from '@/features/dialogue'
import type { Patient } from './types'

export type AvatarStyle = 'short' | 'hijab' | 'bald'

export interface AvatarSpec {
  skin: string
  hair: string
  style: AvatarStyle
  cloth: string
  glasses: boolean
}

const SKIN = [1, 2, 3, 4, 5].map((n) => `var(--mq-skin-${n})`)
const DARK_HAIR = [1, 2, 3].map((n) => `var(--mq-hair-${n})`)
const GRAY_HAIR = 'var(--mq-hair-gray)'
const SCARF = [1, 2, 3, 4].map((n) => `var(--mq-scarf-${n})`)
const CLOTH = [1, 2, 3, 4, 5, 6].map((n) => `var(--mq-cloth-${n})`)

const GRAY_FROM_AGE = 55
const GLASSES_FROM_AGE = 50
/** Changing the salt reshuffles every face; chosen so the demo catalogue gets a varied, plausible cast. */
const SALT = 's89'

function rng(seed: string) {
  let a = hashString(seed) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function avatarSpec(patient: Pick<Patient, 'age' | 'gender'>, seed: string): AvatarSpec {
  const next = rng(SALT + seed)
  const pick = <T,>(items: readonly T[]) => items[Math.floor(next() * items.length)]!
  const skin = pick(SKIN)
  const cloth = pick(CLOTH)
  const styleRoll = next()
  const style: AvatarStyle =
    patient.gender === 'F' ? (styleRoll < 0.85 ? 'hijab' : 'short') : patient.age >= 45 && styleRoll < 0.35 ? 'bald' : 'short'
  const darkHair = pick(DARK_HAIR)
  const scarf = pick(SCARF)
  const hair = style === 'hijab' ? scarf : patient.age >= GRAY_FROM_AGE ? GRAY_HAIR : darkHair
  const glasses = next() < (patient.age >= GLASSES_FROM_AGE ? 0.6 : 0.12)
  return { skin, hair, style, cloth, glasses }
}
