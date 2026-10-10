import {
  BufferGeometry,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Euler,
  BoxGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import type { CatmullRomCurve3 } from 'three'
import type { ClayPalette } from '@/lib/clay-palette'
import { seg, type ClayQuality } from './budget'

export type Vec3 = [number, number, number]

export interface Transform {
  p?: Vec3
  r?: Vec3
  s?: number | Vec3
}

/** Palette as three.js colors plus the derived tones the objects share. */
export interface ClayColors {
  green: Color
  cream: Color
  sky: Color
  coral: Color
  butter: Color
  deep: Color
  ink: Color
  paper: Color
  peach: Color
  line: Color
}

export function clayColors(p: ClayPalette): ClayColors {
  const c = (hex: string) => new Color(hex)
  const mix = (a: Color, b: Color, t: number) => a.clone().lerp(b, t)
  const cream = c(p.cream)
  const coral = c(p.coral)
  const ink = c(p.ink)
  const paper = mix(cream, c(p.surface), 0.55)
  return {
    green: c(p.green),
    cream,
    sky: c(p.sky),
    coral,
    butter: c(p.butter),
    deep: mix(c(p.primary), ink, 0.25),
    ink,
    paper,
    peach: mix(cream, coral, 0.42),
    line: mix(ink, paper, 0.45),
  }
}

const UV_A = new Vector3(1, 0, 0.7)
const UV_B = new Vector3(0, 1, 0.3)
const _m = new Matrix4()
const _q = new Quaternion()
const _e = new Euler()
const _v = new Vector3()

/**
 * Bake a transform and a flat vertex color into a normalised copy (non-indexed, position,
 * normal, uv and color only) so that any mix of primitives can be merged into one draw call.
 * UVs are a continuous skewed planar projection: the procedural bump texture never seams.
 */
export function part(source: BufferGeometry, color: Color, t: Transform = {}): BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source.clone()
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
  }
  if (!g.getAttribute('normal')) g.computeVertexNormals()
  const s = t.s ?? 1
  const scale = typeof s === 'number' ? new Vector3(s, s, s) : new Vector3(...s)
  _m.compose(new Vector3(...(t.p ?? [0, 0, 0])), _q.setFromEuler(_e.set(...(t.r ?? [0, 0, 0]))), scale)
  g.applyMatrix4(_m)

  const pos = g.getAttribute('position')
  const uv = new Float32Array(pos.count * 2)
  const rgb = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    _v.fromBufferAttribute(pos, i)
    uv[i * 2] = _v.dot(UV_A) * 0.9
    uv[i * 2 + 1] = _v.dot(UV_B) * 0.9
    rgb[i * 3] = color.r
    rgb[i * 3 + 1] = color.g
    rgb[i * 3 + 2] = color.b
  }
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setAttribute('color', new Float32BufferAttribute(rgb, 3))
  return g
}

export function merge(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false)
  parts.forEach((g) => g.dispose())
  if (!merged) throw new Error('clay: geometry merge failed')
  merged.computeBoundingSphere()
  return merged
}

/** Re-centre a merged geometry on its bounding box so rotation pivots at the visual centre. */
export function centered(g: BufferGeometry): BufferGeometry {
  g.center()
  g.computeBoundingSphere()
  return g
}

/** Smooth shading for extruded shapes (merge coincident vertices, then average normals). */
export function smoothed(g: BufferGeometry): BufferGeometry {
  g.deleteAttribute('normal')
  g.deleteAttribute('uv')
  const merged = mergeVertices(g, 1e-3)
  merged.computeVertexNormals()
  return merged
}

export const rbox = (q: ClayQuality, w: number, h: number, d: number, r: number, segments = 2) =>
  new RoundedBoxGeometry(w, h, d, seg(q, segments, 1), Math.min(r, w / 2, h / 2, d / 2))

/** Hard-edged slab for tiny details (12 triangles). */
export const slab = (w: number, h: number, d: number) => new BoxGeometry(w, h, d)

export const sphere = (q: ClayQuality, r: number, w = 14, h = 10) =>
  new SphereGeometry(r, seg(q, w, 6), seg(q, h, 4))

export const capsule = (q: ClayQuality, r: number, length: number, radial = 14) =>
  new CapsuleGeometry(r, length, seg(q, 4, 2), seg(q, radial, 6))

export const cylinder = (q: ClayQuality, rTop: number, rBottom: number, h: number, radial = 16) =>
  new CylinderGeometry(rTop, rBottom, h, seg(q, radial, 6), 1)

export const torus = (q: ClayQuality, r: number, tube: number, arc = Math.PI * 2, radial = 20, tubular = 8) =>
  new TorusGeometry(r, tube, seg(q, tubular, 4), seg(q, radial, 8), arc)

export const tube = (q: ClayQuality, curve: CatmullRomCurve3, radius: number, tubular = 32, radial = 8) =>
  new TubeGeometry(curve, seg(q, tubular, 10), radius, seg(q, radial, 5), false)

/** A lathe from a profile of [radius, y] points, with rounded corners applied by the caller. */
export const lathe = (q: ClayQuality, profile: [number, number][], radial = 20) =>
  new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), seg(q, radial, 8))

/** Flat-capped disc or short cylinder with a rounded rim, as a lathe (axis = y, base at y = 0). */
export function roundedDisc(q: ClayQuality, radius: number, height: number, rim: number, radial = 28): BufferGeometry {
  const r = Math.min(rim, height / 2, radius)
  const pts: [number, number][] = [[0, 0]]
  const steps = seg(q, 2, 1)
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2)
    pts.push([radius - r + Math.cos(a) * r, r + Math.sin(a) * r])
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    pts.push([radius - r + Math.cos(a) * r, height - r + Math.sin(a) * r])
  }
  pts.push([0, height])
  return lathe(q, pts, radial)
}

/** Capsule-like half: flat base at y = 0, hemisphere dome on top. */
export function halfCapsule(q: ClayQuality, radius: number, straight: number, radial = 18): BufferGeometry {
  const pts: [number, number][] = [[0, 0], [radius, 0], [radius, straight]]
  const steps = seg(q, 6, 3)
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2)
    pts.push([Math.cos(a) * radius, straight + Math.sin(a) * radius])
  }
  return lathe(q, pts, radial)
}
