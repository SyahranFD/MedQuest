/* oxlint-disable react/immutability -- react-three-fiber mutates three.js objects imperatively by design */
import { addAfterEffect, type ThreeEvent, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CanvasTexture,
  type Color,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
} from 'three'
import type { SceneQuality, ScenePatient } from '@/lib/scene-contract'
import { CameraRig } from './camera-rig'
import { Character, DoctorAvatar } from './character'
import { HEAD_UNIT_M, type Lod } from './character-geometry'
import { MeshBuilder } from './geom'
import { getPalette, type ScenePalette } from './palette'
import { characterScale, ER, placementFor, POLI, type Placement } from './placement'
import { buildRoom } from './room'
import { deriveTraits } from './traits'
import type { SceneShot, SceneStats } from './types'

// --- Room -----------------------------------------------------------------------------------

function Room({ mode, quality, palette }: { mode: 'er' | 'poli'; quality: SceneQuality; palette: ScenePalette }) {
  const room = useMemo(() => buildRoom(mode, palette, quality), [mode, quality, palette])
  const solid = useMemo(() => new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }), [])
  const lit = useMemo(() => new MeshBasicMaterial({ vertexColors: true }), [])
  useEffect(
    () => () => {
      room.solid.dispose()
      room.lit.dispose()
      solid.dispose()
      lit.dispose()
    },
    [room, solid, lit],
  )
  return (
    <>
      <mesh geometry={room.solid} material={solid} />
      <mesh geometry={room.lit} material={lit} />
    </>
  )
}

// --- Cue (hover and selection) -----------------------------------------------------------------

const outlineCache = new Map<string, ReturnType<MeshBuilder['build']>>()

function outlineGeometry(w: number, d: number, color: Color) {
  const key = `${w}x${d}x${color.getHexString()}`
  let g = outlineCache.get(key)
  if (!g) {
    const t = 0.04
    const b = new MeshBuilder()
    b.box([w, 0.01, t], color, { pos: [0, 0, -d / 2] })
    b.box([w, 0.01, t], color, { pos: [0, 0, d / 2] })
    b.box([t, 0.01, d], color, { pos: [-w / 2, 0, 0] })
    b.box([t, 0.01, d], color, { pos: [w / 2, 0, 0] })
    g = b.build()
    outlineCache.set(key, g)
  }
  return g
}

const cueMaterial = new MeshBasicMaterial({ vertexColors: true })

/** Release the shared cue outline geometries and material from the renderer (see `disposeCharacterAssets`). */
export function disposeSceneAssets() {
  for (const g of outlineCache.values()) g.dispose()
  cueMaterial.dispose()
}

function Cue({ placement, color }: { placement: Placement; color: Color }) {
  const [w, d] = placement.cue.size
  return (
    <mesh
      geometry={outlineGeometry(w, d, color)}
      material={cueMaterial}
      position={[placement.cue.center[0], 0.02, placement.cue.center[1]]}
      raycast={() => null}
    />
  )
}

// --- World-space status tag --------------------------------------------------------------------

function useTagTexture(label: string, bg: Color, fg: Color) {
  return useMemo(() => {
    const dpr = 2
    const font = `600 ${15 * dpr}px "Plus Jakarta Sans Variable", system-ui, sans-serif`
    const probe = document.createElement('canvas').getContext('2d')
    if (!probe) return null
    probe.font = font
    const padX = 14 * dpr
    const w = Math.ceil(probe.measureText(label).width + padX * 2)
    const h = 30 * dpr
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = `#${bg.getHexString()}`
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, h / 2)
    ctx.fill()
    ctx.font = font
    ctx.fillStyle = `#${fg.getHexString()}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(label, w / 2, h / 2 + dpr)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return { texture, aspect: w / h }
  }, [label, bg, fg])
}

function StatusTag({ label, tone, position, active, palette }: { label: string; tone?: 'warning' | 'danger'; position: [number, number, number]; active: boolean; palette: ScenePalette }) {
  const bg = tone === 'danger' ? palette.danger : tone === 'warning' ? palette.warning : active ? palette.cueActive : palette.ink
  const fg = tone === 'danger' ? palette.dangerInk : tone === 'warning' ? palette.warningInk : palette.wall
  const tag = useTagTexture(label, bg, fg)
  const sprite = useMemo(() => {
    const s = new Sprite(new SpriteMaterial({ transparent: true, depthWrite: false, toneMapped: false }))
    s.raycast = () => null
    return s
  }, [])
  useEffect(() => {
    if (!tag) return
    sprite.material.map = tag.texture
    sprite.material.needsUpdate = true
    sprite.scale.set(0.11 * tag.aspect, 0.11, 1)
    return () => tag.texture.dispose()
  }, [tag, sprite])
  useEffect(() => () => sprite.material.dispose(), [sprite])
  return <primitive object={sprite} position={position} />
}

// --- Patient ---------------------------------------------------------------------------------------

interface PatientRigProps {
  patient: ScenePatient
  placement: Placement
  active: boolean
  lod: Lod
  reducedMotion: boolean
  showCue: boolean
  hovered: boolean
  palette: ScenePalette
  onHover: (id: string | null) => void
  onSelect?: (id: string) => void
}

function PatientRig({ patient, placement, active, lod, reducedMotion, showCue, hovered, palette, onHover, onSelect }: PatientRigProps) {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const clickable = !!onSelect
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHover(patient.id)
    if (clickable) gl.domElement.style.cursor = 'pointer'
    invalidate()
  }
  const out = () => {
    onHover(null)
    gl.domElement.style.cursor = ''
    invalidate()
  }
  useEffect(
    () => () => {
      gl.domElement.style.cursor = ''
    },
    [gl],
  )
  const tagY = placement.head[1] + 0.5
  return (
    <>
      <group
        position={placement.position}
        rotation={[0, placement.rotationY, 0]}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(patient.id)
        }}
      >
        <Character visual={patient.visual} lod={lod} reducedMotion={reducedMotion} />
      </group>
      <mesh
        position={placement.hit.center}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(patient.id)
        }}
        visible={false}
      >
        <boxGeometry args={placement.hit.size} />
        <meshBasicMaterial />
      </mesh>
      {showCue && (hovered || active) && <Cue placement={placement} color={hovered ? palette.cueActive : palette.cue} />}
      {patient.statusLabel && (
        <StatusTag
          label={patient.statusLabel}
          tone={patient.statusTone}
          position={patient.visual.pose === 'lying' ? [placement.head[0] + 0.55, placement.head[1] + 0.1, placement.head[2]] : [placement.head[0], tagY, placement.head[2]]}
          active={active}
          palette={palette}
        />
      )}
    </>
  )
}

// --- Stats --------------------------------------------------------------------------------------------

function StatsReporter({ onStats, quality, dpr }: { onStats?: (s: SceneStats) => void; quality: SceneQuality; dpr: number }) {
  const gl = useThree((s) => s.gl)
  const last = useRef(0)
  useEffect(() => {
    if (!onStats) return
    return addAfterEffect(() => {
      const now = performance.now()
      if (now - last.current < 500) return
      last.current = now
      const { render, memory } = gl.info
      onStats({ triangles: render.triangles, drawCalls: render.calls, geometries: memory.geometries, quality, dpr })
    })
  }, [gl, onStats, quality, dpr])
  return null
}

// --- Scene --------------------------------------------------------------------------------------------

export interface SceneContentProps {
  mode: 'er' | 'poli'
  patients: ScenePatient[]
  activePatientId: string | null
  onSelectPatient?: (id: string) => void
  quality: SceneQuality
  reducedMotion: boolean
  shot: SceneShot
  dpr: number
  onStats?: (s: SceneStats) => void
}

export function SceneContent({ mode, patients, activePatientId, onSelectPatient, quality, reducedMotion, shot, dpr, onStats }: SceneContentProps) {
  const palette = getPalette()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const placements = useMemo(() => {
    let waiting = 0
    return patients.map((patient, index) => {
      const traits = deriveTraits(patient.visual)
      const s = characterScale(traits.heightScale, HEAD_UNIT_M)
      const pose = patient.visual.pose
      const isWaiting = mode === 'poli' && pose !== 'sitting' && pose !== 'lying'
      return placementFor(mode, patient, index, s, isWaiting ? waiting++ : 0)
    })
  }, [mode, patients])

  const active = patients.findIndex((p) => p.id === activePatientId)
  const activePlacement = active >= 0 ? placements[active] : null
  const activeLying = active >= 0 && patients[active].visual.pose === 'lying'
  const talkingActive = active >= 0 && patients[active].visual.talking

  const shadowKey = useMemo(
    () => `${mode}|${quality}|${patients.map((p, i) => `${p.id}:${p.visual.pose}:${placements[i].position.join(',')}`).join('|')}`,
    [mode, quality, patients, placements],
  )
  const halfW = mode === 'er' ? ER.halfW : POLI.halfW

  return (
    <>
      <color attach="background" args={[palette.background.getHex()]} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, 1.4]} />
      <directionalLight color={palette.keyLight} intensity={2.2} position={[-5, 6.5, 4.5]} />
      <directionalLight color={palette.wall} intensity={0.3} position={[5, 3, 6]} />
      <Room mode={mode} quality={quality} palette={palette} />

      {patients.map((patient, i) => (
        <PatientRig
          key={patient.id}
          patient={patient}
          placement={placements[i]}
          active={patient.id === activePatientId}
          lod={patient.id === activePatientId && quality === 'high' ? 'hero' : quality === 'low' ? 'low' : 'standard'}
          reducedMotion={reducedMotion}
          showCue={mode === 'er' || patients.length > 1}
          hovered={hoveredId === patient.id}
          palette={palette}
          onHover={setHoveredId}
          onSelect={onSelectPatient}
        />
      ))}

      {mode === 'poli' && (
        <group position={[POLI.doctor.x, POLI.doctor.seatY + 0.03, POLI.doctor.z]} rotation={[0, Math.PI + 0.45, 0]}>
          <DoctorAvatar listening={talkingActive} reducedMotion={reducedMotion} />
        </group>
      )}

      {quality === 'high' && (
        <ContactShadows
          key={shadowKey}
          position={[0, 0.004, -0.1]}
          scale={[halfW * 2, 6.2]}
          frames={2}
          resolution={512}
          blur={2.4}
          far={1.6}
          opacity={0.38}
          color={`#${palette.contactShadow.getHexString()}`}
        />
      )}

      <CameraRig
        mode={mode}
        shot={shot}
        head={activePlacement?.head ?? null}
        lying={activeLying}
        facing={activePlacement?.rotationY ?? 0}
        reducedMotion={reducedMotion}
      />
      <StatsReporter onStats={onStats} quality={quality} dpr={dpr} />
    </>
  )
}

