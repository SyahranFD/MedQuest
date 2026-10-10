import {
  BufferGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  MeshStandardMaterial,
  RingGeometry,
} from 'three'
import { MeshBuilder } from './geom'
import type { ScenePalette } from './palette'

// Small expression particles, one shared geometry each. They are shown by scaling (no
// transparency), so each one is a single opaque draw call only while visible.

export type FxName = 'sweat' | 'tear' | 'puff' | 'question' | 'vein' | 'ring'
export const FX_NAMES: readonly FxName[] = ['sweat', 'tear', 'puff', 'question', 'vein', 'ring']

function ribbon(points: [number, number][], thickness: number): BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(i - 1, 0)]
    const b = points[Math.min(i + 1, points.length - 1)]
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const len = Math.hypot(tx, ty) || 1
    const nx = (-ty / len) * (thickness / 2)
    const ny = (tx / len) * (thickness / 2)
    pos.push(points[i][0] + nx, points[i][1] + ny, 0, points[i][0] - nx, points[i][1] - ny, 0)
    if (i < points.length - 1) {
      const k = i * 2
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3))
  g.setIndex(idx)
  return g
}

function arc(cx: number, cy: number, r: number, from: number, to: number, steps: number): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return out
}

export interface FxKit {
  geometry: Record<FxName, BufferGeometry>
  material: MeshStandardMaterial
}

let kit: { palette: ScenePalette; value: FxKit } | null = null

/** Release the shared fx geometries and material from the renderer (see `disposeCharacterAssets`). */
export function disposeFxKit() {
  if (!kit) return
  for (const g of Object.values(kit.value.geometry)) g.dispose()
  kit.value.material.dispose()
}

export function getFxKit(palette: ScenePalette): FxKit {
  if (kit?.palette === palette) return kit.value

  const drop = (color: Color, size: number) => {
    const b = new MeshBuilder()
    b.add(new IcosahedronGeometry(0.055 * size, 0), color)
    b.add(new ConeGeometry(0.05 * size, 0.12 * size, 5), color, { pos: [0, 0.085 * size, 0] })
    return b.build()
  }

  const puff = new MeshBuilder()
  puff.add(new IcosahedronGeometry(0.06, 0), palette.linen, { pos: [0, 0, 0] })
  puff.add(new IcosahedronGeometry(0.045, 0), palette.linen, { pos: [0.08, 0.05, 0] })
  puff.add(new IcosahedronGeometry(0.034, 0), palette.linen, { pos: [0.15, 0.09, 0] })

  const question = new MeshBuilder()
  const path: [number, number][] = [
    ...arc(0, 0.11, 0.075, Math.PI * 0.95, -Math.PI * 0.35, 7),
    [0.02, 0.0],
    [0, -0.04],
  ]
  question.add(ribbon(path, 0.04), palette.sageDeep)
  question.add(new RingGeometry(0, 0.026, 6), palette.sageDeep, { pos: [0, -0.1, 0] })

  const vein = new MeshBuilder()
  for (let k = 0; k < 4; k++) {
    const mid = (Math.PI / 2) * k + Math.PI / 4
    vein.add(ribbon(arc(0, 0, 0.1, mid - 0.5, mid + 0.5, 3), 0.03), palette.alert)
  }

  const ring = new MeshBuilder()
  ring.add(new RingGeometry(0.1, 0.125, 16), palette.sage)

  const value: FxKit = {
    geometry: {
      sweat: drop(palette.sky, 1),
      tear: drop(palette.sky, 0.8),
      puff: puff.build(),
      question: question.build(),
      vein: vein.build(),
      ring: ring.build(),
    },
    material: new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: DoubleSide }),
  }
  kit = { palette, value }
  return value
}
