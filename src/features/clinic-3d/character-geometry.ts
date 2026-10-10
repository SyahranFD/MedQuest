import {
  BufferGeometry,
  Color,
  ConeGeometry,
  IcosahedronGeometry,
  OctahedronGeometry,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  CapsuleGeometry,
} from 'three'
import type { PatientPose } from '@/lib/emotion'
import { HEAD_RX, HEAD_RY, HEAD_RZ } from './face'
import { MeshBuilder } from './geom'
import type { ScenePalette } from './palette'
import type { Traits } from './traits'

// Procedural "Pasien Bulat" geometry. Units are head diameters (H = 1). Every body part is merged
// into a few vertex-colored geometries so a character is 3 to 4 draw calls plus the face mesh.

export type Outfit = 'patient' | 'doctor'
export type Lod = 'hero' | 'standard' | 'low'

/** Seat height below the hip for sitting characters (head units). */
export const SEAT_H = 0.74
export const STAND_HIP_Y = 0.72
/** Neck pivot above the hip and head center above the neck. */
export const NECK_Y = 0.9
export const HEAD_CENTER_Y = 0.42
/** Base size of one head unit in meters. */
export const HEAD_UNIT_M = 0.62

export interface CharacterGeometry {
  upper: BufferGeometry
  /** Present for sitting, standing and lying. */
  lower?: BufferGeometry
  /** Present for walking: legs pivot at the hip. */
  legL?: BufferGeometry
  legR?: BufferGeometry
  head: BufferGeometry
  hipY: number
  skin: Color
  hair: Color
}

const HEAD_DETAIL: Record<Lod, number> = { hero: 3, standard: 2, low: 1 }

export function skinColor(palette: ScenePalette, traits: Traits): Color {
  return palette.skin[traits.skinIndex % palette.skin.length]
}

export function hairColor(palette: ScenePalette, traits: Traits): Color {
  return traits.hairGray ? palette.hairGray : palette.hair[traits.hairIndex % palette.hair.length]
}

function shade(c: Color, f: number) {
  return c.clone().multiplyScalar(f)
}

function buildHead(palette: ScenePalette, traits: Traits, lod: Lod, outfit: Outfit): BufferGeometry {
  const skin = skinColor(palette, traits)
  const hair = hairColor(palette, traits)
  const b = new MeshBuilder()
  const ellipsoid: [number, number, number] = [1, HEAD_RY / HEAD_RX, HEAD_RZ / HEAD_RX]

  b.add(new IcosahedronGeometry(HEAD_RX, HEAD_DETAIL[lod]), skin, { scale: ellipsoid })
  b.add(new OctahedronGeometry(0.075, 0), shade(skin, 0.94), { pos: [-0.5, -0.02, -0.02], scale: [0.6, 1.2, 1] })
  b.add(new OctahedronGeometry(0.075, 0), shade(skin, 0.94), { pos: [0.5, -0.02, -0.02], scale: [0.6, 1.2, 1] })
  b.add(new ConeGeometry(0.05, 0.1, 4, 1, true), shade(skin, 0.95), { pos: [0, -0.075, 0.5], rot: [Math.PI / 2, 0, 0] })

  const cap = (radius: number, theta: number, tilt: number, color: Color, segs = 8, rings = 4) =>
    b.add(new SphereGeometry(radius, segs, rings, 0, Math.PI * 2, 0, theta), color, {
      rot: [tilt, 0, 0],
      scale: ellipsoid,
    })

  switch (traits.hairStyle) {
    case 'short':
      cap(0.53, 1.3, -0.5, hair, 10, 5)
      break
    case 'side':
      cap(0.535, 1.5, -0.62, hair)
      b.add(new SphereGeometry(0.2, 6, 3), hair, { pos: [0.2, 0.36, 0.28], scale: [1.4, 0.6, 0.7] })
      break
    case 'long':
      cap(0.53, 1.4, -0.5, hair)
      b.add(new SphereGeometry(0.5, 8, 5), hair, { pos: [0, -0.28, -0.22], scale: [1.02, 1.45, 0.7] })
      break
    case 'bun':
      cap(0.53, 1.4, -0.5, hair)
      b.add(new IcosahedronGeometry(0.2, 0), hair, { pos: [0, 0.46, -0.24] })
      break
    case 'curly':
      cap(0.53, 1.3, -0.5, hair)
      for (const [x, y, z] of [
        [-0.34, 0.3, -0.05],
        [0.34, 0.3, -0.05],
        [0, 0.46, 0],
        [0, 0.2, -0.42],
      ] as const)
        b.add(new IcosahedronGeometry(0.17, 0), hair, { pos: [x, y, z] })
      break
    case 'hijab': {
      const scarf = palette.clothes[traits.outfitIndex % palette.clothes.length]
      const gap = 0.74
      cap(0.575, 0.68, 0, scarf)
      b.add(new SphereGeometry(0.58, 8, 4, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, 0.62, 1.7), scarf, {
        scale: [1, HEAD_RY / HEAD_RX + 0.03, HEAD_RZ / HEAD_RX + 0.02],
      })
      break
    }
    case 'bald':
      break
  }

  if (traits.accessory === 'peci') {
    b.cylinder(0.3, 0.34, 0.22, palette.ink, { pos: [0, 0.4, -0.02], rot: [-0.22, 0, 0] }, 8)
  }
  if (traits.accessory === 'glasses') {
    for (const side of [-1, 1]) {
      b.add(new RingGeometry(0.078, 0.098, 8), palette.ink, { pos: [side * 0.175, 0.05, 0.495] })
    }
    b.box([0.1, 0.02, 0.02], palette.ink, { pos: [0, 0.065, 0.5] })
  }
  if (traits.accessory === 'plaster') {
    b.box([0.14, 0.07, 0.02], palette.linen, { pos: [0.22, -0.06, 0.445], rot: [0, -0.4, 0.4] })
  }
  if (outfit === 'doctor' && traits.hairStyle === 'bald') {
    b.add(new SphereGeometry(0.2, 6, 3), shade(hair, 1), { pos: [0, 0.4, -0.3], scale: [1.6, 0.3, 0.6] })
  }
  return b.build()
}

interface ArmSpec {
  tilt: number
  forward: number
}

function addArms(b: MeshBuilder, sleeve: Color, skin: Color, width: number, spec: ArmSpec) {
  for (const side of [-1, 1]) {
    const shoulder = { x: side * (0.38 * width + 0.07), y: 0.74 }
    const arm = new CapsuleGeometry(0.09, 0.46, 1, 5)
    const length = 0.64
    // Rotate about Z (outward) and X (forward). Arm hangs along -Y from the shoulder.
    const dx = Math.sin(spec.tilt) * side
    const dz = Math.sin(spec.forward)
    const dy = -Math.cos(spec.tilt) * Math.cos(spec.forward)
    const cx = shoulder.x + (dx * length) / 2
    const cy = shoulder.y + (dy * length) / 2
    const cz = (dz * length) / 2
    b.add(arm, sleeve, { pos: [cx, cy, cz], rot: [-spec.forward, 0, side * spec.tilt] })
    b.add(new OctahedronGeometry(0.09, 0), skin, {
      pos: [shoulder.x + dx * (length + 0.04), shoulder.y + dy * (length + 0.04), dz * (length + 0.04)],
    })
  }
}

function buildUpper(palette: ScenePalette, traits: Traits, pose: PatientPose, outfit: Outfit): BufferGeometry {
  const skin = skinColor(palette, traits)
  const w = traits.build
  const shirt =
    outfit === 'doctor' ? palette.coat : palette.clothes[traits.outfitIndex % palette.clothes.length]
  const b = new MeshBuilder()
  const sitting = pose === 'sitting'

  b.add(new CapsuleGeometry(0.38, 0.2, 1, 8), shirt, {
    pos: [0, 0.43, 0],
    scale: [w * (outfit === 'doctor' ? 1.06 : 1), 1, 0.9 * (outfit === 'doctor' ? 1.06 : 1)],
  })
  addArms(b, shirt, skin, w, sitting ? { tilt: 0.12, forward: 0.62 } : { tilt: 0.14, forward: 0 })

  if (outfit === 'doctor') {
    // Coat skirt over the hips and thighs, lapels, collar shirt, stethoscope.
    b.cylinder(0.43 * w, 0.46 * w, 0.3, palette.coat, { pos: [0, -0.02, 0.02], scale: [1, 1, 0.95] }, 8)
    b.box([0.18, 0.5, 0.03], shade(palette.coat, 0.93), { pos: [-0.1, 0.55, 0.34 * 0.95], rot: [-0.12, 0, 0.22] })
    b.box([0.18, 0.5, 0.03], shade(palette.coat, 0.93), { pos: [0.1, 0.55, 0.34 * 0.95], rot: [-0.12, 0, -0.22] })
    b.box([0.2, 0.32, 0.02], palette.sageSoft, { pos: [0, 0.6, 0.325 * 0.95], rot: [-0.12, 0, 0] })
    b.add(new TorusGeometry(0.2, 0.026, 3, 8, Math.PI * 1.2), palette.ink, {
      pos: [0, 0.82, 0.14],
      rot: [-0.55, 0, Math.PI * 1.4],
    })
    b.cylinder(0.065, 0.065, 0.03, palette.metal, { pos: [0.1, 0.4, 0.36], rot: [Math.PI / 2 - 0.12, 0, 0] }, 8)
  } else {
    // Hem band so the outfit reads as clothes, not a bare capsule.
    b.cylinder(0.385 * w, 0.4 * w, 0.06, shade(shirt, 0.9), { pos: [0, 0.01, 0], scale: [1, 1, 0.9] }, 8)
  }
  return b.build()
}

function legParts(b: MeshBuilder, palette: ScenePalette, x: number, offsetY: number) {
  b.cylinder(0.14, 0.12, 0.72, palette.pants, { pos: [x, offsetY + 0.36, 0] }, 6)
  b.box([0.2, 0.1, 0.34], palette.shoes, { pos: [x, offsetY + 0.05, 0.07] })
}

function buildLower(palette: ScenePalette, pose: PatientPose): BufferGeometry {
  const b = new MeshBuilder()
  if (pose === 'sitting') {
    for (const side of [-1, 1]) {
      const x = side * 0.17
      b.cylinder(0.14, 0.13, 0.62, palette.pants, { pos: [x, 0.14, 0.31], rot: [Math.PI / 2, 0, 0] }, 6)
      b.cylinder(0.125, 0.11, 0.78, palette.pants, { pos: [x, -0.25, 0.62] }, 6)
      b.box([0.2, 0.1, 0.34], palette.shoes, { pos: [x, -SEAT_H + 0.05, 0.68] })
    }
  } else {
    legParts(b, palette, -0.17, 0)
    legParts(b, palette, 0.17, 0)
  }
  return b.build()
}

function buildLeg(palette: ScenePalette, x: number): BufferGeometry {
  const b = new MeshBuilder()
  legParts(b, palette, x, -STAND_HIP_Y)
  return b.build()
}

export function buildCharacterGeometry(
  palette: ScenePalette,
  traits: Traits,
  pose: PatientPose,
  outfit: Outfit,
  lod: Lod,
): CharacterGeometry {
  const sitting = pose === 'sitting'
  const base = {
    upper: buildUpper(palette, traits, pose, outfit),
    head: buildHead(palette, traits, lod, outfit),
    hipY: sitting ? 0.06 : STAND_HIP_Y,
    skin: skinColor(palette, traits),
    hair: hairColor(palette, traits),
  }
  if (pose === 'walking') {
    return { ...base, legL: buildLeg(palette, -0.17), legR: buildLeg(palette, 0.17) }
  }
  return { ...base, lower: buildLower(palette, pose) }
}

export function disposeCharacterGeometry(g: CharacterGeometry) {
  g.upper.dispose()
  g.head.dispose()
  g.lower?.dispose()
  g.legL?.dispose()
  g.legR?.dispose()
}
