import { CatmullRomCurve3, ExtrudeGeometry, Shape, SplineCurve, Vector2, Vector3 } from 'three'
import type { BufferGeometry, Color } from 'three'
import type { ClayPalette } from '@/lib/clay-palette'
import { seg, type ClayQuality } from '../budget'
import {
  capsule,
  centered,
  clayColors,
  cylinder,
  halfCapsule,
  lathe,
  merge,
  part,
  rbox,
  slab,
  roundedDisc,
  smoothed,
  sphere,
  torus,
  tube,
  type ClayColors,
} from '../geometry'
import { CLAY_OBJECT_NAMES, type ClayObjectName } from './names'

export { CLAY_OBJECT_NAMES, type ClayObjectName }

type Build = (c: ClayColors, q: ClayQuality) => BufferGeometry[]

const HALF = Math.PI / 2

const pill: Build = (c, q) => {
  const r = 0.27
  const straight = 0.3
  return [
    part(halfCapsule(q, r, straight), c.green, { p: [0, 0.01, 0] }),
    part(halfCapsule(q, r, straight), c.cream, { p: [0, -0.01, 0], r: [Math.PI, 0, 0] }),
  ]
}

function plusShape(arm: number, half: number) {
  const a = arm / 2
  const s = new Shape()
  s.moveTo(-a, -half)
  s.lineTo(a, -half)
  s.lineTo(a, -a)
  s.lineTo(half, -a)
  s.lineTo(half, a)
  s.lineTo(a, a)
  s.lineTo(a, half)
  s.lineTo(-a, half)
  s.lineTo(-a, a)
  s.lineTo(-half, a)
  s.lineTo(-half, -a)
  s.lineTo(-a, -a)
  s.closePath()
  return s
}

const cross: Build = (c, q) => {
  const g = new ExtrudeGeometry(plusShape(0.34, 0.46), {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.11,
    bevelSize: 0.1,
    bevelSegments: seg(q, 3, 2),
    curveSegments: 1,
  })
  g.translate(0, 0, -0.07)
  return [part(roundedDisc(q, 0.78, 0.16, 0.07, 32), c.cream, { p: [0, -0.62, 0] }), part(smoothed(g), c.coral)]
}

function heartShape() {
  const s = new Shape()
  s.moveTo(0, -0.9)
  s.bezierCurveTo(-0.3, -0.65, -1, -0.2, -1, 0.35)
  s.bezierCurveTo(-1, 0.85, -0.35, 1.05, 0, 0.55)
  s.bezierCurveTo(0.35, 1.05, 1, 0.85, 1, 0.35)
  s.bezierCurveTo(1, -0.2, 0.3, -0.65, 0, -0.9)
  return s
}

const heart: Build = (c, q) => {
  const g = new ExtrudeGeometry(heartShape(), {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.16,
    bevelSegments: seg(q, 4, 2),
    curveSegments: seg(q, 10, 5),
  })
  g.translate(0, 0, -0.1)
  return [part(smoothed(g), c.coral, { s: 0.62 })]
}

const stethoscope: Build = (c, q) => {
  const stem = new CatmullRomCurve3(
    [
      new Vector3(0, 0.12, 0),
      new Vector3(0, -0.3, 0),
      new Vector3(0.04, -0.62, 0),
      new Vector3(0.28, -0.82, 0),
      new Vector3(0.52, -0.66, 0),
      new Vector3(0.54, -0.42, 0),
    ],
    false,
    'catmullrom',
    0.5,
  )
  const left = new CatmullRomCurve3(
    [new Vector3(-0.42, 0.8, 0), new Vector3(-0.4, 0.4, 0), new Vector3(-0.22, 0.16, 0), new Vector3(0, 0.12, 0)],
    false,
    'catmullrom',
    0.5,
  )
  const right = new CatmullRomCurve3(
    [new Vector3(0.42, 0.8, 0), new Vector3(0.4, 0.4, 0), new Vector3(0.22, 0.16, 0), new Vector3(0, 0.12, 0)],
    false,
    'catmullrom',
    0.5,
  )
  return [
    part(tube(q, stem, 0.05, 24, 6), c.sky),
    part(tube(q, left, 0.05, 12, 6), c.sky),
    part(tube(q, right, 0.05, 12, 6), c.sky),
    part(sphere(q, 0.085, 8, 6), c.cream, { p: [-0.42, 0.84, 0] }),
    part(sphere(q, 0.085, 8, 6), c.cream, { p: [0.42, 0.84, 0] }),
    part(roundedDisc(q, 0.23, 0.12, 0.05, 18), c.cream, { p: [0.54, -0.42, 0.0], r: [HALF, 0, 0] }),
    part(roundedDisc(q, 0.13, 0.04, 0.02, 14), c.green, { p: [0.54, -0.42, 0.115], r: [HALF, 0, 0] }),
  ]
}

const syringe: Build = (c, q) => [
  part(capsule(q, 0.17, 0.95, 12), c.paper, { p: [0, 0.1, 0] }),
  part(cylinder(q, 0.178, 0.178, 0.5, 12), c.butter, { p: [0, -0.08, 0] }),
  part(rbox(q, 0.62, 0.08, 0.22, 0.04, 1), c.cream, { p: [0, 0.68, 0] }),
  part(cylinder(q, 0.055, 0.055, 0.7, 10), c.cream, { p: [0, 1.05, 0] }),
  part(roundedDisc(q, 0.22, 0.09, 0.04, 14), c.green, { p: [0, 1.4, 0] }),
  part(cylinder(q, 0.04, 0.12, 0.2, 14), c.cream, { p: [0, -0.74, 0] }),
  part(cylinder(q, 0.022, 0.022, 0.55, 8), c.line, { p: [0, -1.1, 0] }),
]

const thermometer: Build = (c, q) => [
  part(capsule(q, 0.1, 1.3, 12), c.paper, { p: [0, 0.1, 0] }),
  part(sphere(q, 0.18, 12, 8), c.coral, { p: [0, -0.62, 0] }),
  part(capsule(q, 0.034, 0.7, 6), c.coral, { p: [0, -0.2, 0.09] }),
  ...[0.3, 0.45, 0.6, 0.75, 0.9, 1.05].map((y, i) =>
    part(slab(i % 2 ? 0.07 : 0.11, 0.025, 0.04), c.green, { p: [0.12, y - 0.4, 0.04] }),
  ),
]

const clipboard: Build = (c, q) => [
  part(rbox(q, 0.98, 1.34, 0.12, 0.08), c.green),
  part(rbox(q, 0.8, 1.12, 0.05, 0.03, 1), c.paper, { p: [0, -0.04, 0.08] }),
  part(rbox(q, 0.42, 0.2, 0.14, 0.07, 1), c.sky, { p: [0, 0.64, 0.06] }),
  ...[0.12, -0.14, -0.4].map((y) => part(slab(0.42, 0.06, 0.04), c.line, { p: [0.12, y, 0.115] })),
  part(capsule(q, 0.034, 0.16, 8), c.green, { p: [-0.27, 0.075, 0.12], r: [0, 0, -0.75] }),
  part(capsule(q, 0.034, 0.3, 8), c.green, { p: [-0.18, 0.13, 0.12], r: [0, 0, 0.7] }),
  part(sphere(q, 0.045, 6, 4), c.green, { p: [-0.27, -0.14, 0.12] }),
  part(sphere(q, 0.045, 6, 4), c.green, { p: [-0.27, -0.4, 0.12] }),
]

const firstAid: Build = (c, q) => [
  part(rbox(q, 1.3, 0.92, 0.5, 0.16), c.green),
  part(slab(1.32, 0.06, 0.52), c.deep, { p: [0, 0.2, 0] }),
  part(torus(q, 0.22, 0.05, Math.PI, 12, 6), c.cream, { p: [0, 0.46, 0] }),
  part(rbox(q, 0.5, 0.17, 0.05, 0.05, 1), c.paper, { p: [0, -0.1, 0.25] }),
  part(rbox(q, 0.17, 0.5, 0.05, 0.05, 1), c.paper, { p: [0, -0.1, 0.25] }),
  part(slab(0.12, 0.14, 0.08), c.butter, { p: [-0.5, 0.2, 0.25] }),
  part(slab(0.12, 0.14, 0.08), c.butter, { p: [0.5, 0.2, 0.25] }),
]

const plaster: Build = (c, q) => {
  const dots: BufferGeometry[] = []
  for (const x of [-0.5, -0.35, 0.35, 0.5]) {
    for (const y of [-0.07, 0.07]) {
      dots.push(part(cylinder(q, 0.026, 0.026, 0.13, 6), c.deep.clone().lerp(c.peach, 0.55), { p: [x, y, 0], r: [HALF, 0, 0] }))
    }
  }
  return [
    part(rbox(q, 1.5, 0.44, 0.1, 0.1, 2), c.peach),
    part(rbox(q, 0.58, 0.36, 0.13, 0.05, 1), c.paper),
    ...dots,
  ]
}

const potion: Build = (c, q) => {
  const spline = new SplineCurve(
    (
      [
        [0.001, 0],
        [0.24, 0],
        [0.34, 0.07],
        [0.38, 0.2],
        [0.38, 0.55],
        [0.34, 0.74],
        [0.2, 0.86],
        [0.15, 0.95],
        [0.15, 1.08],
      ] as const
    ).map(([x, y]) => new Vector2(x, y)),
  )
  const profile = spline.getPoints(seg(q, 14, 8)).map((p) => [p.x, p.y] as [number, number])
  return [
    part(lathe(q, profile, 20), c.sky, { p: [0, -0.55, 0] }),
    part(roundedDisc(q, 0.2, 0.24, 0.07, 14), c.cream, { p: [0, 0.5, 0] }),
    part(cylinder(q, 0.395, 0.395, 0.34, 20), c.paper, { p: [0, -0.1, 0] }),
    part(slab(0.2, 0.05, 0.05), c.coral, { p: [0, -0.1, 0.395] }),
    part(slab(0.05, 0.2, 0.05), c.coral, { p: [0, -0.1, 0.395] }),
  ]
}

const briefcase: Build = (c, q) => {
  const handle = new CatmullRomCurve3(
    [
      new Vector3(-0.3, 0.68, 0),
      new Vector3(-0.3, 0.9, 0),
      new Vector3(-0.19, 1.0, 0),
      new Vector3(0.19, 1.0, 0),
      new Vector3(0.3, 0.9, 0),
      new Vector3(0.3, 0.68, 0),
    ],
    false,
    'catmullrom',
    0.4,
  )
  const diag = 22 * (Math.PI / 180)
  return [
    part(rbox(q, 1.36, 1.46, 0.5, 0.15, 2), c.cream),
    part(tube(q, handle, 0.06, 18, 6), c.line),
    part(rbox(q, 0.3, 1.5, 0.56, 0.06, 1), c.green, { p: [-0.5, 0, 0] }),
    part(rbox(q, 0.3, 1.5, 0.56, 0.06, 1), c.green, { p: [0.5, 0, 0] }),
    part(rbox(q, 0.26, 1.3, 0.07, 0.04, 1), c.green, { p: [-0.2, 0.0, 0.27], r: [0, 0, diag] }),
    part(rbox(q, 0.26, 1.3, 0.07, 0.04, 1), c.green, { p: [0.2, 0.0, 0.27], r: [0, 0, -diag] }),
    part(rbox(q, 0.34, 0.16, 0.62, 0.05, 1), c.sky, { p: [-0.5, 0.66, 0] }),
    part(rbox(q, 0.34, 0.16, 0.62, 0.05, 1), c.sky, { p: [0.5, 0.66, 0] }),
  ]
}

const BUILDERS: Record<ClayObjectName, Build> = {
  pill,
  cross,
  heart,
  stethoscope,
  syringe,
  thermometer,
  clipboard,
  firstAid,
  plaster,
  potion,
  briefcase,
}

/** Build one clay object as a single merged geometry (vertex colors, centred). */
export function buildClayObject(name: ClayObjectName, palette: ClayPalette, quality: ClayQuality, main?: string): BufferGeometry {
  const colors = clayColors(palette)
  if (main) overrideMain(name, colors, main)
  return centered(merge(BUILDERS[name](colors, quality)))
}

const MAIN_ROLE: Record<ClayObjectName, keyof ClayColors> = {
  pill: 'green',
  cross: 'coral',
  heart: 'coral',
  stethoscope: 'sky',
  syringe: 'green',
  thermometer: 'coral',
  clipboard: 'green',
  firstAid: 'green',
  plaster: 'peach',
  potion: 'sky',
  briefcase: 'green',
}

function overrideMain(name: ClayObjectName, colors: ClayColors, hex: string) {
  const role = MAIN_ROLE[name]
  const next = (colors[role] as Color).clone().set(hex)
  colors[role] = next
}
