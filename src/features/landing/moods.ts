import { EMOTIONS, type Emotion } from '@/lib/emotion'

/**
 * Face parameters for the landing mood picker, a 2D reading of the table in
 * design/analysis/characters-clay-teak.md A3. Tilt > 0 raises the inner end of the brow (worried),
 * tilt < 0 drops it (angry). Heights are in head units above the eye line.
 */
export interface FaceParams {
  tiltL: number
  tiltR: number
  heightL: number
  heightR: number
  /** -1 frown to +1 smile. */
  curve: number
  /** 0 closed line to 1 wide open. */
  open: number
  /** Eye height scale; below 1 reads as a squint or heavy lids. */
  eye: number
  /** Head roll in degrees. */
  roll: number
  extra?: 'sweat' | 'tear' | 'blush' | 'question'
}

export const FACE: Record<Emotion, FaceParams> = {
  netral: { tiltL: 0, tiltR: 0, heightL: 0.15, heightR: 0.15, curve: 0, open: 0, eye: 1, roll: 0 },
  cemas: { tiltL: 18, tiltR: 18, heightL: 0.2, heightR: 0.2, curve: -0.25, open: 0.15, eye: 1, roll: 3, extra: 'sweat' },
  sakit: { tiltL: 14, tiltR: 14, heightL: 0.1, heightR: 0.1, curve: -0.45, open: 0.1, eye: 0.6, roll: -6 },
  sedih: { tiltL: 24, tiltR: 24, heightL: 0.12, heightR: 0.12, curve: -0.7, open: 0.05, eye: 0.8, roll: -8, extra: 'tear' },
  marah: { tiltL: -26, tiltR: -26, heightL: 0.06, heightR: 0.06, curve: -0.5, open: 0.35, eye: 1, roll: 0, extra: 'blush' },
  bingung: { tiltL: 12, tiltR: -10, heightL: 0.22, heightR: 0.12, curve: -0.1, open: 0.1, eye: 1, roll: 11, extra: 'question' },
  lega: { tiltL: 8, tiltR: 8, heightL: 0.17, heightR: 0.17, curve: 0.35, open: 0.15, eye: 0.75, roll: 2 },
  senang: { tiltL: 4, tiltR: 4, heightL: 0.22, heightR: 0.22, curve: 0.85, open: 0.55, eye: 0.7, roll: -3, extra: 'blush' },
}

const MOUTH_X1 = 35
const MOUTH_X2 = 65
const MOUTH_Y = 70

const round = (n: number) => Math.round(n * 10) / 10

/** SVG path of the mouth in a 100 x 100 face. Open mouths close into a filled shape. */
export function mouthPath(curve: number, open: number): string {
  const endY = round(MOUTH_Y - curve * 3)
  const ctrlY = round(endY + curve * 14)
  const upper = `M${MOUTH_X1} ${endY} Q50 ${ctrlY} ${MOUTH_X2} ${endY}`
  if (open < 0.2) return upper
  return `${upper} Q50 ${round(ctrlY + open * 18)} ${MOUTH_X1} ${endY} Z`
}

/** Brow bar geometry for the left (-1) or right (+1) side. */
export function browTransform(side: -1 | 1, tilt: number, height: number) {
  const cx = side === -1 ? 36 : 64
  const y = round(50 - height * 60)
  const rotate = side === -1 ? -tilt : tilt
  return { x1: cx - 7, x2: cx + 7, y, rotate, cx }
}

/** Next mood in picker order, wrapping at both ends (arrow-key roving focus). */
export function stepMood(current: Emotion, delta: 1 | -1): Emotion {
  const i = EMOTIONS.indexOf(current)
  return EMOTIONS[(i + delta + EMOTIONS.length) % EMOTIONS.length]!
}
