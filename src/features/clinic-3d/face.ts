import { BufferAttribute, BufferGeometry, Color, Sphere, Vector3 } from 'three'

// The face is ONE dynamic mesh (eyes, brows, mouth, blush) projected onto the head ellipsoid, so
// all expression changes cost zero extra draw calls. Topology is fixed; only vertices move.

/** Head ellipsoid radii in head units (head diameter is 1.0). */
export const HEAD_RX = 0.5
export const HEAD_RY = 0.47
export const HEAD_RZ = 0.48

export const EYE_Y = 0.05
export const EYE_X = 0.175
const MOUTH_Y = -0.205

const EYE_SEGMENTS = 10
const BLUSH_SEGMENTS = 8
const BROW_STATIONS = 4
const MOUTH_POINTS = 9

const EYE_VERTS = EYE_SEGMENTS + 1
const BLUSH_VERTS = BLUSH_SEGMENTS + 1
const BROW_VERTS = BROW_STATIONS * 2
const MOUTH_VERTS = MOUTH_POINTS * 2

const TOTAL_VERTS = EYE_VERTS * 2 + BROW_VERTS * 2 + MOUTH_VERTS * 3 + BLUSH_VERTS * 2

export interface FaceDraw {
  /** 0 closed to 1 open (already includes the emotion squint and blink). */
  eyeOpen: number
  browTiltL: number
  browTiltR: number
  browHeightL: number
  browHeightR: number
  browThick: number
  mouthCurve: number
  mouthOpen: number
  mouthWidth: number
  mouthSkew: number
  blush: number
  /** Skin color as it appears on the head (after the sick tint). */
  skin: Color
}

export interface FaceColors {
  ink: Color
  mouthInner: Color
  blush: Color
}

const tmp = new Vector3()

/** Writes a point projected onto the head ellipsoid, plus its normal. */
function project(pos: Float32Array, nor: Float32Array, i: number, x: number, y: number, lift: number) {
  const k = 1 - (x / HEAD_RX) ** 2 - (y / HEAD_RY) ** 2
  const z = HEAD_RZ * Math.sqrt(Math.max(k, 0.02)) + lift
  pos[i * 3] = x
  pos[i * 3 + 1] = y
  pos[i * 3 + 2] = z
  tmp.set(x / HEAD_RX ** 2, y / HEAD_RY ** 2, z / HEAD_RZ ** 2).normalize()
  nor[i * 3] = tmp.x
  nor[i * 3 + 1] = tmp.y
  nor[i * 3 + 2] = tmp.z
}

export class FaceMesh {
  readonly geometry = new BufferGeometry()
  private pos = new Float32Array(TOTAL_VERTS * 3)
  private nor = new Float32Array(TOTAL_VERTS * 3)
  private col = new Float32Array(TOTAL_VERTS * 3)
  private posAttr: BufferAttribute
  private norAttr: BufferAttribute
  private colAttr: BufferAttribute

  private colors: FaceColors

  constructor(colors: FaceColors) {
    this.colors = colors
    this.posAttr = new BufferAttribute(this.pos, 3)
    this.norAttr = new BufferAttribute(this.nor, 3)
    this.colAttr = new BufferAttribute(this.col, 3)
    this.posAttr.setUsage(35048)
    this.norAttr.setUsage(35048)
    this.colAttr.setUsage(35048)
    this.geometry.setAttribute('position', this.posAttr)
    this.geometry.setAttribute('normal', this.norAttr)
    this.geometry.setAttribute('color', this.colAttr)
    this.geometry.setIndex(buildIndex())
    this.geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0.3), 0.7)
  }

  update(d: FaceDraw) {
    const { pos, nor, col } = this
    let v = 0

    // Eyes: two filled ellipses.
    for (const side of [-1, 1]) {
      const cx = side * EYE_X
      project(pos, nor, v, cx, EYE_Y, 0.014)
      for (let s = 0; s < EYE_SEGMENTS; s++) {
        const a = (s / EYE_SEGMENTS) * Math.PI * 2
        project(
          pos,
          nor,
          v + 1 + s,
          cx + Math.cos(a) * 0.056,
          EYE_Y + Math.sin(a) * 0.066 * d.eyeOpen,
          0.014,
        )
      }
      v += EYE_VERTS
    }

    // Brows: tapered bars, tilt measured as "inner end up" for both sides.
    const browBase = EYE_Y + 0.06
    v = this.writeBrow(v, -1, browBase + 0.55 * d.browHeightL, d.browTiltL, d.browThick)
    v = this.writeBrow(v, 1, browBase + 0.55 * d.browHeightR, d.browTiltR, d.browThick)

    // Mouth: upper lip ribbon, lower lip ribbon, dark fill between them.
    const half = 0.17 * d.mouthWidth
    const thick = 0.036
    const upper: [number, number][] = []
    const lower: [number, number][] = []
    for (let i = 0; i < MOUTH_POINTS; i++) {
      const u = (i / (MOUTH_POINTS - 1)) * 2 - 1
      const yU = MOUTH_Y + d.mouthCurve * 0.12 * (u * u - 0.5) + d.mouthSkew * u * 0.6
      const gap = d.mouthOpen * 0.16 * (1 - u * u) ** 0.7
      upper.push([d.mouthSkew + u * half, yU])
      lower.push([d.mouthSkew + u * half, yU - gap])
    }
    v = this.writeRibbon(v, upper, thick)
    v = this.writeRibbon(v, lower, thick)
    for (let i = 0; i < MOUTH_POINTS; i++) {
      project(pos, nor, v + i * 2, upper[i][0], upper[i][1], 0.014)
      project(pos, nor, v + i * 2 + 1, lower[i][0], lower[i][1], 0.014)
    }
    v += MOUTH_VERTS

    // Blush discs: collapse to a point when the blush is off.
    const radius = d.blush > 0.03 ? 0.085 * (0.6 + 0.4 * Math.min(d.blush * 1.4, 1)) : 0
    for (const side of [-1, 1]) {
      const cx = side * 0.29
      project(pos, nor, v, cx, -0.1, 0.01)
      for (let s = 0; s < BLUSH_SEGMENTS; s++) {
        const a = (s / BLUSH_SEGMENTS) * Math.PI * 2
        project(pos, nor, v + 1 + s, cx + Math.cos(a) * radius, -0.1 + Math.sin(a) * radius, 0.01)
      }
      v += BLUSH_VERTS
    }

    this.writeColors(d, col)
    this.posAttr.needsUpdate = true
    this.norAttr.needsUpdate = true
    this.colAttr.needsUpdate = true
  }

  private writeBrow(v: number, side: -1 | 1, cy: number, tiltDeg: number, thick: number): number {
    const length = 0.215
    const half = (0.026 * thick) / 1
    const taper = [0.6, 1, 1, 0.6]
    const theta = (tiltDeg * Math.PI) / 180
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    const cx = side * EYE_X
    for (let s = 0; s < BROW_STATIONS; s++) {
      const u = (s / (BROW_STATIONS - 1) - 0.5) * length
      for (const sign of [1, -1]) {
        const w = half * taper[s] * sign
        const px = u * cos - w * sin
        const py = u * sin + w * cos
        // Inner is +u: left brow (x < 0) has inner toward +x, right brow toward -x.
        project(this.pos, this.nor, v++, cx - side * px, cy + py, 0.022)
      }
    }
    return v
  }

  private writeRibbon(v: number, points: [number, number][], thickness: number): number {
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(i - 1, 0)]
      const b = points[Math.min(i + 1, points.length - 1)]
      let tx = b[0] - a[0]
      let ty = b[1] - a[1]
      const len = Math.hypot(tx, ty) || 1
      tx /= len
      ty /= len
      const nx = -ty * (thickness / 2)
      const ny = tx * (thickness / 2)
      project(this.pos, this.nor, v++, points[i][0] + nx, points[i][1] + ny, 0.018)
      project(this.pos, this.nor, v++, points[i][0] - nx, points[i][1] - ny, 0.018)
    }
    return v
  }

  private writeColors(d: FaceDraw, col: Float32Array) {
    const { ink, mouthInner, blush } = this.colors
    let v = 0
    const set = (count: number, c: Color) => {
      for (let i = 0; i < count; i++, v++) {
        col[v * 3] = c.r
        col[v * 3 + 1] = c.g
        col[v * 3 + 2] = c.b
      }
    }
    set(EYE_VERTS * 2, ink)
    set(BROW_VERTS * 2, ink)
    set(MOUTH_VERTS * 2, ink)
    set(MOUTH_VERTS, mouthInner)
    const strength = 0.35 + 0.65 * Math.min(d.blush * 1.6, 1)
    tmp.set(d.skin.r, d.skin.g, d.skin.b).lerp(new Vector3(blush.r, blush.g, blush.b), strength)
    for (let i = 0; i < BLUSH_VERTS * 2; i++, v++) {
      col[v * 3] = tmp.x
      col[v * 3 + 1] = tmp.y
      col[v * 3 + 2] = tmp.z
    }
  }

  dispose() {
    this.geometry.dispose()
  }
}

function buildIndex(): number[] {
  const idx: number[] = []
  let base = 0
  const fan = (segments: number) => {
    for (let s = 0; s < segments; s++) idx.push(base, base + 1 + s, base + 1 + ((s + 1) % segments))
    base += segments + 1
  }
  const strip = (stations: number) => {
    for (let s = 0; s < stations - 1; s++) {
      const a = base + s * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    base += stations * 2
  }
  fan(EYE_SEGMENTS)
  fan(EYE_SEGMENTS)
  strip(BROW_STATIONS)
  strip(BROW_STATIONS)
  strip(MOUTH_POINTS)
  strip(MOUTH_POINTS)
  strip(MOUTH_POINTS)
  fan(BLUSH_SEGMENTS)
  fan(BLUSH_SEGMENTS)
  return idx
}

export const FACE_TRIANGLES = EYE_SEGMENTS * 2 + (BROW_STATIONS - 1) * 2 * 2 + (MOUTH_POINTS - 1) * 2 * 3 + BLUSH_SEGMENTS * 2
