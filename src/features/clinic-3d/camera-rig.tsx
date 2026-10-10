/* oxlint-disable react/immutability -- react-three-fiber mutates three.js objects imperatively by design */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import type { SceneMode } from '@/lib/scene-contract'
import { driftOffset, frameFor } from './camera-math'
import type { Vec3 } from './geom'
import type { SceneShot } from './types'

interface CameraRigProps {
  mode: SceneMode
  shot: SceneShot
  /** Head center of the active patient, or null for the room overview. */
  head: Vec3 | null
  lying: boolean
  facing: number
  reducedMotion: boolean
}

// Dolly lambda: about 0.9 s to settle. Small amplitude, no overshoot (critically damped).
const DOLLY_LAMBDA = 3.4

/** Spring-damped dolly between patients with an optional slow drift. */
export function CameraRig({ mode, shot, head, lying, facing, reducedMotion }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const invalidate = useThree((s) => s.invalidate)
  const state = useRef({ pos: new Vector3(), look: new Vector3(), ready: false })

  useEffect(() => {
    invalidate()
  }, [mode, shot, head, lying, facing, reducedMotion, invalidate])

  useFrame((s, delta) => {
    const aspect = s.size.width / Math.max(s.size.height, 1)
    const goal = frameFor(mode, shot, head, lying, aspect, facing)
    const drift = driftOffset(s.clock.elapsedTime, reducedMotion)
    const cur = state.current
    const lambda = reducedMotion || !cur.ready ? 1000 : DOLLY_LAMBDA
    const dt = Math.min(delta, 0.1)
    for (const axis of [0, 1, 2] as const) {
      const key = (['x', 'y', 'z'] as const)[axis]
      cur.pos[key] = MathUtils.damp(cur.ready ? cur.pos[key] : goal.position[axis], goal.position[axis] + drift[axis], lambda, dt)
      cur.look[key] = MathUtils.damp(cur.ready ? cur.look[key] : goal.look[axis], goal.look[axis] + drift[axis] * 0.5, lambda, dt)
    }
    cur.ready = true
    camera.position.copy(cur.pos)
    camera.lookAt(cur.look)
    if (camera.fov !== 34 || camera.aspect !== aspect) {
      camera.fov = 34
      camera.updateProjectionMatrix()
    }
    const settled =
      cur.pos.distanceTo(new Vector3(...goal.position)) < 0.002 && cur.look.distanceTo(new Vector3(...goal.look)) < 0.002
    if (!settled) s.invalidate()
  })
  return null
}
