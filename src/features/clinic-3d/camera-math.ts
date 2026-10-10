import type { SceneMode } from '@/lib/scene-contract'
import type { Vec3 } from './geom'
import type { SceneShot } from './types'

// Pure camera framing math (no three.js) so it can be tested.

export const CAMERA_FOV = 34
const MAX_DISTANCE = 11

export interface Framing {
  position: Vec3
  look: Vec3
}

interface ShotSpec {
  /** Vertical extent in meters to fit. */
  height: number
  /** Horizontal extent in meters to fit (matters on portrait screens). */
  width: number
  azimuth: number
  elevation: number
}

const WIDE: Record<SceneMode, { look: Vec3; spec: ShotSpec }> = {
  poli: { look: [0.1, 1.15, -0.3], spec: { height: 2.8, width: 6.4, azimuth: 0.04, elevation: 0.3 } },
  er: { look: [0, 0.8, -1.3], spec: { height: 3.0, width: 8.6, azimuth: 0.0, elevation: 0.52 } },
}

/**
 * Where the camera goes for a shot. `head` is the active patient's head center, or null for the
 * room overview. `lying` raises the camera so the face is visible from above.
 */
export function frameFor(
  mode: SceneMode,
  shot: SceneShot,
  head: Vec3 | null,
  lying: boolean,
  aspect: number,
  /** Direction the active patient faces (radians about Y): the camera sits in front of the face. */
  facing = 0,
): Framing {
  let look: Vec3
  let spec: ShotSpec
  if (!head || shot === 'wide') {
    look = WIDE[mode].look
    spec = WIDE[mode].spec
  } else if (shot === 'face') {
    look = [head[0], head[1] - 0.02, head[2]]
    spec = { height: 1.25, width: 1.2, azimuth: facing + 0.12, elevation: lying ? 1.1 : 0.06 }
  } else {
    look = [head[0], head[1] - (lying ? 0.0 : 0.22), head[2]]
    spec = { height: 2.1, width: 1.9, azimuth: facing + 0.12, elevation: lying ? 1.0 : 0.14 }
  }
  const vfov = (CAMERA_FOV * Math.PI) / 180
  const tanV = Math.tan(vfov / 2)
  const tanH = tanV * aspect
  const distance = Math.min(Math.max(spec.height / 2 / tanV, spec.width / 2 / tanH), MAX_DISTANCE)
  const cosEl = Math.cos(spec.elevation)
  return {
    look,
    position: [
      look[0] + Math.sin(spec.azimuth) * cosEl * distance,
      look[1] + Math.sin(spec.elevation) * distance,
      look[2] + Math.cos(spec.azimuth) * cosEl * distance,
    ],
  }
}

/** Slow drift offset in meters; zero under reduced motion. */
export function driftOffset(time: number, reduced: boolean): Vec3 {
  if (reduced) return [0, 0, 0]
  return [Math.sin(time * 0.31) * 0.05, Math.sin(time * 0.23 + 1) * 0.025, 0]
}
