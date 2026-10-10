/* oxlint-disable react/immutability -- react-three-fiber mutates three.js objects imperatively by design */
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, type Group, type Mesh, MeshStandardMaterial } from 'three'
import { clamp, type PatientVisual } from '@/lib/emotion'
import {
  buildCharacterGeometry,
  type CharacterGeometry,
  HEAD_CENTER_Y,
  HEAD_UNIT_M,
  type Lod,
  NECK_Y,
  type Outfit,
  skinColor,
} from './character-geometry'
import {
  Blinker,
  ExpressionSpring,
  POSITIVE_EMOTIONS,
  targetParams,
  VisemeCycler,
} from './expression'
import { FaceMesh, type FaceDraw } from './face'
import { FX_NAMES, type FxName, getFxKit } from './fx'
import { getPalette } from './palette'
import { deriveTraits, hashSeed, makeRng, type Traits, traitsKey } from './traits'

const geometryCache = new Map<string, CharacterGeometry>()

function cachedGeometry(traits: Traits, pose: PatientVisual['pose'], outfit: Outfit, lod: Lod) {
  const key = `${outfit}|${pose}|${lod}|${traitsKey(traits)}`
  let g = geometryCache.get(key)
  if (!g) {
    g = buildCharacterGeometry(getPalette(), traits, pose, outfit, lod)
    geometryCache.set(key, g)
  }
  return g
}

/** Free the GPU side of the module-level caches. A renderer registers dispose listeners on shared geometries and materials, so without this a closed scene stays reachable from the cache. Meshes re-upload on the next mount. */
export function disposeCharacterAssets() {
  for (const g of geometryCache.values()) {
    for (const part of [g.upper, g.lower, g.legL, g.legR, g.head]) part?.dispose()
  }
  bodyMaterial?.dispose()
}

let bodyMaterial: MeshStandardMaterial | null = null
function getBodyMaterial() {
  bodyMaterial ??= new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 })
  return bodyMaterial
}

const SICK_MULTIPLIER = new Color(0.82, 0.94, 0.74)
const WHITE = new Color(1, 1, 1)

export interface CharacterProps {
  visual: PatientVisual
  outfit?: Outfit
  /** Level of detail: hero for the active patient, standard otherwise. */
  lod?: Lod
  reducedMotion?: boolean
  /** Doctor only: gentle nodding while the patient speaks. */
  listening?: boolean
  traitOverrides?: Partial<Traits>
}

/** Body, head, face and particles for one character. Placement is the parent's job. */
export function Character({
  visual,
  outfit = 'patient',
  lod = 'standard',
  reducedMotion = false,
  listening = false,
  traitOverrides,
}: CharacterProps) {
  const invalidate = useThree((s) => s.invalidate)
  const palette = getPalette()
  const traits = useMemo(
    () => ({ ...deriveTraits(visual), ...traitOverrides }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- identifying inputs only
    [visual.seed, visual.age, visual.gender, traitOverrides],
  )
  const pose = visual.pose
  const geo = cachedGeometry(traits, pose, outfit, lod)
  const scale = HEAD_UNIT_M * traits.heightScale
  const skin = skinColor(palette, traits)

  const faceInk = useMemo(() => {
    const ink = palette.faceInk.clone()
    ink.r = Math.min(ink.r, skin.r * 0.22)
    ink.g = Math.min(ink.g, skin.g * 0.22)
    ink.b = Math.min(ink.b, skin.b * 0.22)
    return ink
  }, [palette, skin])

  const face = useMemo(
    () => new FaceMesh({ ink: faceInk, mouthInner: palette.mouthInner, blush: palette.blush }),
    [faceInk, palette],
  )
  const headMaterial = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }),
    [],
  )
  const faceMaterial = useMemo(
    () => new MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: DoubleSide }),
    [],
  )
  const fx = useMemo(() => getFxKit(palette), [palette])

  const hip = useRef<Group>(null)
  const head = useRef<Group>(null)
  const walk = useRef<Group>(null)
  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const fxRefs = useRef<Partial<Record<FxName, Mesh | null>>>({})

  const rng = useMemo(() => makeRng(hashSeed(`${visual.seed}|anim`)), [visual.seed])
  const sim = useMemo(
    () => ({
      spring: new ExpressionSpring(targetParams(visual.emotion, visual.intensity)),
      blinker: new Blinker(rng),
      viseme: new VisemeCycler(rng),
      talkMix: 0,
      draw: { skin: new Color() } as FaceDraw,
      fxStart: 0,
    }),
    // Created once per character identity; emotion changes go through setTarget.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- initial emotion only, changes use setTarget
    [rng],
  )

  const clock = useThree((s) => s.clock)
  useEffect(() => {
    const now = clock.elapsedTime
    sim.spring.setTarget(
      targetParams(visual.emotion, visual.intensity),
      now,
      POSITIVE_EMOTIONS.has(visual.emotion),
      reducedMotion,
    )
    sim.fxStart = now
    invalidate()
  }, [visual.emotion, visual.intensity, reducedMotion, sim, clock, invalidate])

  useEffect(() => {
    invalidate()
  }, [pose, lod, traits, invalidate])

  useEffect(
    () => () => {
      face.dispose()
      headMaterial.dispose()
      faceMaterial.dispose()
    },
    [face, headMaterial, faceMaterial],
  )

  const talking = visual.talking
  useFrame((state, delta) => {
    const now = state.clock.elapsedTime
    const p = sim.spring.current
    const moving = sim.spring.step(delta, now)
    const reduced = reducedMotion

    const blink = reduced ? 1 : sim.blinker.update(now, p.blinkPerMin, p.blinkSlow)
    const k = 1 - Math.exp(-18 * Math.min(delta, 0.1))
    sim.talkMix += ((talking ? 1 : 0) - sim.talkMix) * k
    let open = p.mouthOpen
    let width = 1
    if (sim.talkMix > 0.01) {
      const v = sim.viseme.update(now)
      open += (v.open - open) * sim.talkMix
      width += (v.width - width) * sim.talkMix
    }

    const d = sim.draw
    d.eyeOpen = clamp(p.eyeScaleY * blink, 0.08, 1.05)
    d.browTiltL = p.browTiltL
    d.browTiltR = p.browTiltR
    d.browHeightL = p.browHeightL
    d.browHeightR = p.browHeightR
    d.browThick = p.browThick
    d.mouthCurve = p.mouthCurve
    d.mouthOpen = clamp(open, 0, 1)
    d.mouthWidth = width
    d.mouthSkew = p.mouthSkew
    d.blush = p.blush
    d.skin.copy(skin).lerp(palette.sickSkin, clamp(p.sickTint * 2.5, 0, 0.5))
    face.update(d)
    headMaterial.color.copy(WHITE).lerp(SICK_MULTIPLIER, clamp(p.sickTint * 6, 0, 0.6))

    const animate = !reduced
    const breath = animate ? Math.sin((now * Math.PI * 2) / p.breathPeriod) : 0
    const slump = clamp(p.slump + traits.stoop, 0, 1)
    const sway = animate ? Math.sin(now * 1.9) * 0.014 : 0
    const tremble = animate && p.tremble > 0 ? Math.sin(now * Math.PI * 2 * 9) * p.tremble : 0

    const walking = pose === 'walking'
    const stride = walking && animate ? Math.sin(now * Math.PI * 2 * 1.7) : 0
    if (walk.current) {
      walk.current.position.y = walking && animate ? Math.abs(stride) * 0.05 : 0
      walk.current.position.z = walking && animate ? Math.sin(now * 0.5) * 0.25 : 0
    }
    if (legL.current) legL.current.rotation.x = stride * 0.55
    if (legR.current) legR.current.rotation.x = -stride * 0.55

    if (hip.current) {
      hip.current.scale.y = 1 + breath * p.breathAmp
      hip.current.rotation.x = slump * 0.36 + (walking && animate ? 0.06 : 0)
      hip.current.rotation.z = walking && animate ? stride * 0.04 : 0
      hip.current.position.x = tremble
    }
    if (head.current) {
      const talkNod = animate ? Math.sin(now * Math.PI * 2 * 4) * 0.026 * sim.talkMix : 0
      const listenNod = listening && animate ? (Math.sin(now * Math.PI * 2 * 0.9) * 0.5 + 0.35) * 0.07 : 0
      head.current.rotation.x = -slump * 0.14 + talkNod + listenNod
      head.current.rotation.z = (p.headRoll * Math.PI) / 180 + sway
      head.current.position.y = NECK_Y - slump * 0.05 + breath * 0.006 * (animate ? 1 : 0)
      head.current.position.z = slump * 0.2 + p.headForward
    }

    const t = now - sim.fxStart
    for (const name of FX_NAMES) {
      const mesh = fxRefs.current[name]
      if (mesh) animateFx(name, mesh, p[FX_KEY[name]], now, t, animate)
    }

    if (moving || talking || sim.talkMix > 0.02) state.invalidate()
  })

  return (
    <group scale={scale} rotation={pose === 'lying' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <group ref={walk}>
        {geo.lower && <mesh geometry={geo.lower} material={getBodyMaterial()} />}
        {geo.legL && (
          <group ref={legL} position={[0, geo.hipY, 0]}>
            <mesh geometry={geo.legL} material={getBodyMaterial()} />
          </group>
        )}
        {geo.legR && (
          <group ref={legR} position={[0, geo.hipY, 0]}>
            <mesh geometry={geo.legR} material={getBodyMaterial()} />
          </group>
        )}
        <group ref={hip} position={[0, geo.hipY, 0]}>
          <mesh geometry={geo.upper} material={getBodyMaterial()} />
          <group ref={head} position={[0, NECK_Y, 0]} scale={traits.headScale}>
            <group position={[0, HEAD_CENTER_Y, 0]}>
              <mesh geometry={geo.head} material={headMaterial} />
              <mesh geometry={face.geometry} material={faceMaterial} frustumCulled={false} />
              {FX_NAMES.map((name) => (
                <mesh
                  key={name}
                  ref={(m) => {
                    fxRefs.current[name] = m
                  }}
                  geometry={fx.geometry[name]}
                  material={fx.material}
                  visible={false}
                  frustumCulled={false}
                />
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

const FX_KEY = {
  sweat: 'fxSweat',
  tear: 'fxTear',
  puff: 'fxPuff',
  question: 'fxQuestion',
  vein: 'fxVein',
  ring: 'fxRing',
} as const

function easeOut(x: number) {
  return 1 - (1 - x) * (1 - x)
}

/** Positions, scales and shows one particle. `amount` is the spring-smoothed 0..1 weight. */
function animateFx(name: FxName, mesh: Mesh, amount: number, now: number, since: number, animate: boolean) {
  const a = clamp(amount, 0, 1)
  if (a < 0.02) {
    mesh.visible = false
    return
  }
  mesh.visible = true
  let s = a
  switch (name) {
    case 'sweat': {
      const c = animate ? (now % 1.8) / 1.8 : 0.3
      mesh.position.set(0.36, 0.3 - c * 0.3, 0.3)
      s *= animate ? Math.min(1, c * 6, (1 - c) * 4) : 1
      break
    }
    case 'tear': {
      const c = animate ? ((now + 0.6) % 1.5) / 1.5 : 0.3
      mesh.position.set(-0.2, -0.04 - c * 0.2, 0.46 - c * 0.04)
      s *= animate ? Math.min(1, c * 6, (1 - c) * 4) : 1
      break
    }
    case 'puff': {
      const c = animate ? (since % 2.4) / 2.4 : 0.35
      mesh.position.set(0.22 + c * 0.25, -0.22 + c * 0.1, 0.5)
      s *= animate ? Math.sin(Math.PI * c) : 1
      break
    }
    case 'question': {
      mesh.position.set(0.36, 0.62 + (animate ? Math.sin(now * 2) * 0.012 : 0), 0.1)
      s *= 1.35 * easeOut(clamp(since * 3, 0, 1))
      break
    }
    case 'vein': {
      mesh.position.set(0.4, 0.42, 0.3)
      s *= 1 + (animate ? Math.sin(now * 5) * 0.06 : 0)
      break
    }
    case 'ring': {
      mesh.position.set(0.44, 0.52, 0.1)
      if (animate) {
        const c = since / 1.4
        s *= c < 2 ? (0.5 + 0.9 * (c % 1)) * (1 - (c % 1) * 0.85) : 0
        if (s < 0.02) mesh.visible = false
      }
      break
    }
  }
  mesh.scale.setScalar(Math.max(s, 0.001))
}

export interface PatientCharacterProps {
  visual: PatientVisual
  lod?: Lod
  reducedMotion?: boolean
}

export function PatientCharacter({ visual, lod = 'standard', reducedMotion }: PatientCharacterProps) {
  return <Character visual={visual} lod={lod} reducedMotion={reducedMotion} outfit="patient" />
}

const DOCTOR_VISUAL: PatientVisual = {
  seed: 'dokter-ayu',
  age: 34,
  gender: 'F',
  emotion: 'senang',
  intensity: 0.12,
  talking: false,
  pose: 'sitting',
}
const DOCTOR_TRAITS: Partial<Traits> = { hairStyle: 'bun', accessory: 'none', skinIndex: 1, build: 0.98 }

export interface DoctorAvatarProps {
  /** True while the patient speaks: the doctor nods gently. */
  listening?: boolean
  reducedMotion?: boolean
}

export function DoctorAvatar({ listening = false, reducedMotion }: DoctorAvatarProps) {
  return (
    <Character
      visual={DOCTOR_VISUAL}
      outfit="doctor"
      lod="standard"
      listening={listening}
      reducedMotion={reducedMotion}
      traitOverrides={DOCTOR_TRAITS}
    />
  )
}
