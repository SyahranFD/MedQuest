import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, MathUtils } from 'three'
import type { Group, Mesh, PerspectiveCamera } from 'three'
import { QUALITY_PROFILES } from './budget'
import { useClay } from './clay-context'
import { ClayObject, type ClayObjectProps } from './clay-object'
import { floatOffset, floatParams } from './float'
import { roundedDisc } from './geometry'
import type { ClayObjectName } from './objects/builders'
import { criticalSpringStep, omegaFromResponse, type SpringState } from './spring'

export interface ClayStats {
  triangles: number
  calls: number
}

/** Soft hemisphere + warm key + cool rim, a tiny procedural softbox environment, no asset downloads. */
export function ClayRig({ groundRadius = 0, shadowScale = 12, shadows = true }: { groundRadius?: number; shadowScale?: number; shadows?: boolean }) {
  const { palette, quality } = useClay()
  const profile = QUALITY_PROFILES[quality]
  const colors = useMemo(() => {
    const surface = new Color(palette.surface)
    return {
      sky: surface.clone().lerp(new Color(palette.sky), 0.18),
      bounce: new Color(palette.green).lerp(new Color(palette.tint), 0.45),
      key: new Color(palette.surface).lerp(new Color(palette.butter), 0.14),
      rim: new Color(palette.sky).lerp(surface, 0.4),
      ground: new Color(palette.tint).lerp(new Color(palette.green), 0.55),
      shadow: new Color(palette.primary).lerp(new Color(palette.ink), 0.8),
    }
  }, [palette])
  const pedestal = useMemo(() => (groundRadius > 0 ? roundedDisc(quality, groundRadius, 0.2, 0.1, 48) : null), [groundRadius, quality])
  useEffect(() => () => pedestal?.dispose(), [pedestal])

  return (
    <>
      <hemisphereLight args={[colors.sky, colors.bounce, 1.5]} />
      <directionalLight color={colors.key} intensity={2.6} position={[4, 7, 5]} />
      <directionalLight color={colors.rim} intensity={0.9} position={[-5, 3, -5]} />
      <Environment resolution={profile.environmentResolution} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 4]} scale={[10, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[-6, 2, 2]} scale={[4, 6, 1]} color={colors.rim} />
        <Lightformer form="rect" intensity={1} position={[6, 1, -2]} scale={[4, 6, 1]} />
      </Environment>
      {pedestal && (
        <mesh geometry={pedestal} position={[0, -0.2, 0]}>
          <meshStandardMaterial color={colors.ground} roughness={0.92} />
        </mesh>
      )}
      {shadows && (
        <ContactShadows
          position={[0, 0.002, 0]}
          opacity={0.95}
          blur={1.8}
          far={3.6}
          scale={shadowScale}
          resolution={profile.shadowResolution}
          color={colors.shadow}
          frames={1}
        />
      )}
    </>
  )
}

/** Idle float for illustration only (CLAUDE.md 8.3 E2): at most 6px, 4s+ cycles, static when reduced. */
export function ClayFloat({ seed, index = 0, children, position }: { seed: number; index?: number; children: ReactNode; position: [number, number, number] }) {
  const ref = useRef<Group>(null)
  const { active, reduced } = useClay()
  const invalidate = useThree((s) => s.invalidate)
  const params = useMemo(() => floatParams(seed, index), [seed, index])

  useEffect(() => {
    if (!reduced || !ref.current) return
    ref.current.position.set(...position)
    ref.current.rotation.z = 0
    invalidate()
  }, [reduced, position, invalidate])

  useFrame((state) => {
    const g = ref.current
    if (!g || reduced || !active) return
    const cam = state.camera as PerspectiveCamera
    const dist = cam.position.distanceTo(g.position)
    const worldPerPx = (2 * Math.tan(MathUtils.degToRad(cam.fov) / 2) * dist) / state.size.height
    const { y, tilt } = floatOffset(params, state.clock.elapsedTime)
    g.position.set(position[0], position[1] + y * worldPerPx, position[2])
    g.rotation.z = MathUtils.degToRad(tilt)
  })

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

export interface ClayItemProps extends ClayObjectProps {
  name: ClayObjectName
  position: [number, number, number]
  seed: number
}

export function ClayItem({ name, position, seed, ...rest }: ClayItemProps) {
  return (
    <ClayFloat seed={seed} index={name.length} position={position}>
      <ClayObject name={name} {...rest} />
    </ClayFloat>
  )
}

const PARALLAX_OMEGA = omegaFromResponse(0.55)

/** Cursor parallax: whole composition tilts a few degrees, critically damped (no overshoot). */
export function ClayParallax({ children, yaw = 0.14, pitch = 0.07 }: { children: ReactNode; yaw?: number; pitch?: number }) {
  const ref = useRef<Group>(null)
  const { active, reduced } = useClay()
  const invalidate = useThree((s) => s.invalidate)
  const target = useRef({ x: 0, y: 0 })
  const sx = useRef<SpringState>({ x: 0, v: 0 })
  const sy = useRef<SpringState>({ x: 0, v: 0 })

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      target.current.x = target.current.y = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

  useEffect(() => {
    if (!reduced || !ref.current) return
    ref.current.rotation.set(0, 0, 0)
    sx.current = { x: 0, v: 0 }
    sy.current = { x: 0, v: 0 }
    invalidate()
  }, [reduced, invalidate])

  useFrame((_, delta) => {
    const g = ref.current
    if (!g || reduced || !active) return
    const dt = Math.min(delta, 0.05)
    sx.current = criticalSpringStep(sx.current, target.current.x, PARALLAX_OMEGA, dt)
    sy.current = criticalSpringStep(sy.current, target.current.y, PARALLAX_OMEGA, dt)
    g.rotation.y = sx.current.x * yaw
    g.rotation.x = sy.current.x * pitch
  })

  return <group ref={ref}>{children}</group>
}

/** Counts what the scene submits per frame: visible meshes (draw calls) and their triangles. */
export function ClayStatsProbe({ onStats }: { onStats: (stats: ClayStats) => void }) {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const read = () => {
      let triangles = 0
      let calls = 0
      scene.traverseVisible((o) => {
        const m = o as Mesh
        if (!m.isMesh) return
        calls++
        const g = m.geometry
        triangles += Math.floor((g.index ? g.index.count : g.getAttribute('position').count) / 3)
      })
      onStats({ triangles, calls })
    }
    const id = window.setInterval(read, 500)
    const first = window.setTimeout(read, 300)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(first)
    }
  }, [scene, onStats])
  return null
}

/** Scales the composition down on narrow canvases so the design width always fits. */
export function ClayFit({ width, children }: { width: number; children: ReactNode }) {
  const viewportWidth = useThree((s) => s.viewport.width)
  const scale = Math.min(1, viewportWidth / width)
  return <group scale={scale}>{children}</group>
}
