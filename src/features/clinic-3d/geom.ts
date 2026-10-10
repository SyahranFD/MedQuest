import {
  BoxGeometry,
  BufferGeometry,
  type Color,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Vec3 = [number, number, number]

export interface Place {
  pos?: Vec3
  /** Euler XYZ in radians. */
  rot?: Vec3
  scale?: Vec3
}

const m = new Matrix4()
const q = new Quaternion()
const e = new Euler()
const v = new Vector3()
const s = new Vector3()

/**
 * Collects primitives with a flat vertex color each and merges them into ONE non-indexed
 * geometry (position, normal, color), so a whole room or a whole body part is a single draw call.
 */
export class MeshBuilder {
  private parts: BufferGeometry[] = []

  add(geometry: BufferGeometry, color: Color, place: Place = {}): this {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone()
    g.deleteAttribute('uv')
    if (place.pos || place.rot || place.scale) {
      e.set(...(place.rot ?? [0, 0, 0]))
      q.setFromEuler(e)
      v.set(...(place.pos ?? [0, 0, 0]))
      s.set(...(place.scale ?? [1, 1, 1]))
      m.compose(v, q, s)
      g.applyMatrix4(m)
    }
    const count = g.getAttribute('position').count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3))
    this.parts.push(g)
    return this
  }

  box(size: Vec3, color: Color, place: Place = {}): this {
    return this.add(new BoxGeometry(...size), color, place)
  }

  /** Low-poly cylinder (default 8 sides). */
  cylinder(radiusTop: number, radiusBottom: number, height: number, color: Color, place: Place = {}, sides = 8): this {
    return this.add(new CylinderGeometry(radiusTop, radiusBottom, height, sides, 1), color, place)
  }

  get size() {
    return this.parts.length
  }

  build(): BufferGeometry {
    const merged = mergeGeometries(this.parts, false)
    for (const part of this.parts) part.dispose()
    this.parts = []
    return merged
  }
}

export function countTriangles(geometry: BufferGeometry): number {
  const index = geometry.getIndex()
  if (index) return index.count / 3
  return geometry.getAttribute('position').count / 3
}
