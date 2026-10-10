import type { PatientPose } from '@/lib/emotion'
import type { SceneMode, ScenePatient } from '@/lib/scene-contract'
import { HEAD_CENTER_Y, NECK_Y, STAND_HIP_Y } from './character-geometry'
import type { Vec3 } from './geom'

// Where things stand in each room. Meters, Y up, the camera looks from +Z toward -Z.

export const POLI = {
  halfW: 3.3,
  backZ: -3,
  frontZ: 3.2,
  wallH: 2.9,
  chair: { x: 0.45, z: -0.55, seatY: 0.46 },
  doctor: { x: -0.95, z: 1.25, seatY: 0.46 },
  bed: { x: 2.35, z: -1, topY: 0.74, headZ: -1.85 },
  desk: { x: -0.1, z: 0.4, topY: 0.74 },
} as const

export const ER = {
  halfW: 4.6,
  backZ: -3,
  frontZ: 3.2,
  wallH: 2.9,
  bedXs: [-2.4, 0, 2.4],
  bedZ: -1.75,
  bedTopY: 0.69,
  headZ: -2.55,
} as const

export interface Placement {
  /** Root of the character (feet for standing, seat for sitting, feet end for lying). */
  position: Vec3
  rotationY: number
  /** Head center in world space (camera target). */
  head: Vec3
  /** Footprint for the hover and selection cue. */
  cue: { center: [number, number]; size: [number, number] }
  /** Invisible click proxy. */
  hit: { center: Vec3; size: Vec3 }
}

/** Overall character scale for a given height multiplier (meters per head unit). */
export function characterScale(heightScale: number, headUnitM = 0.62) {
  return headUnitM * heightScale
}

function headPoint(pose: PatientPose, position: Vec3, s: number): Vec3 {
  if (pose === 'lying') return [position[0], position[1] + 0.12, position[2] - (STAND_HIP_Y + NECK_Y + HEAD_CENTER_Y) * s]
  const up = pose === 'sitting' ? 0.06 + NECK_Y + HEAD_CENTER_Y : STAND_HIP_Y + NECK_Y + HEAD_CENTER_Y
  return [position[0], position[1] + up * s, position[2]]
}

function build(
  pose: PatientPose,
  position: Vec3,
  rotationY: number,
  s: number,
  cue: Placement['cue'],
): Placement {
  const head = headPoint(pose, position, s)
  const hit: Placement['hit'] =
    pose === 'lying'
      ? { center: [position[0], position[1] + 0.1, position[2] - 1.0 * s * 1.2], size: [0.9, 0.6, 2.6 * s] }
      : { center: [position[0], position[1] + (pose === 'sitting' ? 0.45 : 0.85) * s * 1.2, position[2]], size: [0.9 * s * 1.3, 1.9 * s, 0.8 * s * 1.3] }
  return { position, rotationY, head, cue, hit }
}

/** Poli: one chair, one exam bed, and waiting spots for extra standing patients. */
export function poliPlacement(pose: PatientPose, s: number, waitingIndex = 0): Placement {
  const { chair, bed } = POLI
  if (pose === 'sitting') {
    return build(pose, [chair.x, chair.seatY + 0.03, chair.z + 0.05], -0.4, s, {
      center: [chair.x, chair.z],
      size: [0.85, 0.85],
    })
  }
  if (pose === 'lying') {
    const y = bed.topY + 0.36 * s
    return build(pose, [bed.x, y, bed.headZ + 2.45 * s], 0, s, { center: [bed.x, bed.z], size: [1.05, 2.15] })
  }
  const x = 1.15 + waitingIndex * 0.55
  return build(pose, [x, 0, -0.9 - waitingIndex * 0.3], -0.45, s, { center: [x, -0.9 - waitingIndex * 0.3], size: [0.7, 0.7] })
}

/** ER: bedIndex picks a bay. Lying and sitting are on the bed; others stand at its foot. */
export function erPlacement(pose: PatientPose, s: number, bedIndex: number): Placement {
  const bx = ER.bedXs[Math.min(Math.max(bedIndex, 0), ER.bedXs.length - 1)]
  const cue = { center: [bx, ER.bedZ] as [number, number], size: [1.15, 2.1] as [number, number] }
  if (pose === 'lying') {
    return build(pose, [bx, ER.bedTopY + 0.36 * s, ER.headZ + 2.45 * s], 0, s, cue)
  }
  if (pose === 'sitting') {
    return build(pose, [bx, ER.bedTopY + 0.05, -1.95], 0, s, cue)
  }
  return build(pose, [bx, 0, -0.35], 0, s, cue)
}

export function placementFor(
  mode: SceneMode,
  patient: ScenePatient,
  index: number,
  s: number,
  waitingIndex: number,
): Placement {
  return mode === 'er'
    ? erPlacement(patient.visual.pose, s, patient.bedIndex ?? index)
    : poliPlacement(patient.visual.pose, s, waitingIndex)
}

