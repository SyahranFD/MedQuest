import { BufferGeometry, Color, IcosahedronGeometry, OctahedronGeometry } from 'three'
import type { SceneMode, SceneQuality } from '@/lib/scene-contract'
import { MeshBuilder, type Vec3 } from './geom'
import type { ScenePalette } from './palette'
import { ER, POLI } from './placement'

// Room shells and furniture, merged into two geometries per room: `solid` (lit, flat shaded) and
// `lit` (window panes, screens, paper: unlit so they read as daylight and glass).

export interface RoomGeometry {
  solid: BufferGeometry
  lit: BufferGeometry
}

class Room {
  readonly s = new MeshBuilder()
  readonly l = new MeshBuilder()
  readonly p: ScenePalette
  readonly detail: boolean

  constructor(p: ScenePalette, detail: boolean) {
    this.p = p
    this.detail = detail
  }
}

function shell(r: Room, halfW: number, backZ: number, frontZ: number, wallH: number) {
  const { s, p } = r
  const depth = frontZ - backZ
  const midZ = (frontZ + backZ) / 2
  s.box([halfW * 2 + 0.3, 0.12, depth], p.floor, { pos: [0, -0.06, midZ] })
  s.box([halfW * 2 + 0.3, wallH, 0.15], p.wall, { pos: [0, wallH / 2, backZ - 0.075] })
  s.box([0.15, wallH, depth], p.wall, { pos: [-halfW - 0.075, wallH / 2, midZ] })
  s.box([0.15, wallH, depth], p.wall, { pos: [halfW + 0.075, wallH / 2, midZ] })
  // Baseboards and a sage floor border.
  s.box([halfW * 2, 0.1, 0.03], p.wood, { pos: [0, 0.05, backZ + 0.015] })
  s.box([0.03, 0.1, depth], p.wood, { pos: [-halfW + 0.015, 0.05, midZ] })
  s.box([0.03, 0.1, depth], p.wood, { pos: [halfW - 0.015, 0.05, midZ] })
  s.box([halfW * 2 - 0.3, 0.012, 0.12], p.floorBorder, { pos: [0, 0.006, backZ + 0.3] })
  s.box([0.12, 0.012, depth - 0.5], p.floorBorder, { pos: [-halfW + 0.3, 0.006, midZ - 0.1] })
  s.box([0.12, 0.012, depth - 0.5], p.floorBorder, { pos: [halfW - 0.3, 0.006, midZ - 0.1] })
}

/** Window on the left wall (normal +x). Center z, center y, width along z, height. */
function windowLeft(r: Room, halfW: number, cz: number, cy: number, w: number, h: number) {
  const { s, l, p } = r
  const x = -halfW
  l.box([0.02, h, w], p.skyLight, { pos: [x + 0.02, cy, cz] })
  l.box([0.01, h * 0.45, w], p.sky, { pos: [x + 0.03, cy - h * 0.27, cz] })
  const t = 0.06
  s.box([0.07, t, w + 0.12], p.wood, { pos: [x + 0.04, cy + h / 2 + t / 2, cz] })
  s.box([0.07, t, w + 0.12], p.wood, { pos: [x + 0.04, cy - h / 2 - t / 2, cz] })
  s.box([0.07, h, t], p.wood, { pos: [x + 0.04, cy, cz - w / 2 - t / 2] })
  s.box([0.07, h, t], p.wood, { pos: [x + 0.04, cy, cz + w / 2 + t / 2] })
  s.box([0.07, h, 0.04], p.wood, { pos: [x + 0.045, cy, cz] })
  s.box([0.07, 0.04, w], p.wood, { pos: [x + 0.045, cy + h * 0.1, cz] })
  s.box([0.2, 0.04, w + 0.2], p.wood, { pos: [x + 0.1, cy - h / 2 - 0.08, cz] })
}

/** Window on the back wall (normal +z). */
function windowBack(r: Room, backZ: number, cx: number, cy: number, w: number, h: number) {
  const { s, l, p } = r
  const z = backZ
  l.box([w, h, 0.02], p.skyLight, { pos: [cx, cy, z + 0.02] })
  l.box([w, h * 0.45, 0.01], p.sky, { pos: [cx, cy - h * 0.27, z + 0.03] })
  const t = 0.06
  s.box([w + 0.12, t, 0.07], p.wood, { pos: [cx, cy + h / 2 + t / 2, z + 0.04] })
  s.box([w + 0.12, t, 0.07], p.wood, { pos: [cx, cy - h / 2 - t / 2, z + 0.04] })
  s.box([t, h, 0.07], p.wood, { pos: [cx - w / 2 - t / 2, cy, z + 0.04] })
  s.box([t, h, 0.07], p.wood, { pos: [cx + w / 2 + t / 2, cy, z + 0.04] })
  s.box([0.04, h, 0.07], p.wood, { pos: [cx, cy, z + 0.045] })
  s.box([w, 0.04, 0.07], p.wood, { pos: [cx, cy + h * 0.1, z + 0.045] })
  s.box([w + 0.2, 0.04, 0.2], p.wood, { pos: [cx, cy - h / 2 - 0.08, z + 0.1] })
}

function plant(r: Room, x: number, z: number, scale = 1, potColor: Color = r.p.wood) {
  const { s, p } = r
  s.cylinder(0.17 * scale, 0.12 * scale, 0.34 * scale, potColor, { pos: [x, 0.17 * scale, z] })
  const leaves: [number, number, number, number, number][] = [
    [0, 0.62, 0, 0.26, 1.5],
    [0.14, 0.82, 0.05, 0.2, 1.4],
    [-0.15, 0.75, -0.06, 0.2, 1.4],
    [0.03, 1.02, -0.04, 0.17, 1.3],
    [-0.08, 0.5, 0.12, 0.17, 1.2],
  ]
  leaves.forEach(([dx, dy, dz, rad, stretch], i) => {
    s.add(new IcosahedronGeometry(rad * scale, 0), i % 2 ? p.plant : p.plantDark, {
      pos: [x + dx * scale, dy * scale + 0.1 * scale, z + dz * scale],
      rot: [i * 0.7, i * 1.3, i * 0.4],
      scale: [0.8, stretch, 0.8],
    })
  })
}

function chair(r: Room, x: number, z: number, rotY: number, facing: 1 | -1, seatColor: Color) {
  // Chair local frame: seat at origin, back behind it (opposite of facing).
  const { s, p } = r
  const rot: Vec3 = [0, rotY, 0]
  const at = (lx: number, y: number, lz: number): Vec3 => {
    const c = Math.cos(rotY)
    const sn = Math.sin(rotY)
    return [x + lx * c + lz * sn, y, z - lx * sn + lz * c]
  }
  s.box([0.5, 0.07, 0.5], seatColor, { pos: at(0, 0.44, 0), rot })
  s.box([0.5, 0.5, 0.06], seatColor, { pos: at(0, 0.74, -0.25 * facing), rot })
  for (const lx of [-0.2, 0.2]) {
    for (const lz of [-0.2, 0.2]) {
      s.box([0.04, 0.42, 0.04], p.wood, { pos: at(lx, 0.21, lz), rot })
    }
  }
  s.box([0.5, 0.025, 0.04], p.wood, { pos: at(0, 0.3, 0.2), rot })
}

function swivelChair(r: Room, x: number, z: number, rotY: number) {
  const { s, p } = r
  const rot: Vec3 = [0, rotY, 0]
  const c = Math.cos(rotY)
  const sn = Math.sin(rotY)
  const at = (lx: number, y: number, lz: number): Vec3 => [x + lx * c + lz * sn, y, z - lx * sn + lz * c]
  s.box([0.52, 0.09, 0.5], p.fabric, { pos: at(0, 0.44, 0), rot })
  s.box([0.5, 0.58, 0.07], p.fabric, { pos: at(0, 0.78, 0.26), rot })
  s.cylinder(0.04, 0.04, 0.3, p.metal, { pos: [x, 0.25, z] }, 6)
  s.box([0.5, 0.03, 0.06], p.metal, { pos: [x, 0.04, z], rot: [0, rotY, 0] })
  s.box([0.06, 0.03, 0.5], p.metal, { pos: [x, 0.04, z], rot: [0, rotY, 0] })
  for (const side of [-1, 1]) s.box([0.04, 0.04, 0.34], p.metal, { pos: at(side * 0.28, 0.62, 0), rot })
}

function buildPoli(r: Room): RoomGeometry {
  const { s, l, p, detail } = r
  const { halfW, backZ, frontZ, wallH } = POLI
  shell(r, halfW, backZ, frontZ, wallH)

  windowLeft(r, halfW, -0.4, 1.55, 2.7, 1.5)
  windowBack(r, backZ, 1.9, 1.55, 1.3, 1.1)
  plant(r, -3.0, -2.6, 1.3)
  plant(r, 2.75, -2.6, 1.05, p.sage)

  // Rug
  s.box([2.6, 0.02, 2.0], p.rug, { pos: [0.1, 0.011, 0.1] })
  s.box([2.5, 0.022, 0.06], p.floorBorder, { pos: [0.1, 0.012, 1.0] })

  // Bookshelf on the back wall
  const bx = -1.9
  const bz = backZ + 0.2
  s.box([1.7, 0.04, 0.38], p.wood, { pos: [bx, 2.08, bz] })
  s.box([0.04, 2.08, 0.38], p.wood, { pos: [bx - 0.83, 1.04, bz] })
  s.box([0.04, 2.08, 0.38], p.wood, { pos: [bx + 0.83, 1.04, bz] })
  s.box([1.62, 2.0, 0.02], p.woodDark, { pos: [bx, 1.04, bz - 0.17] })
  for (const y of [0.1, 0.58, 1.06, 1.54]) s.box([1.62, 0.035, 0.36], p.wood, { pos: [bx, y, bz] })
  if (detail) {
    const books = [p.bookA, p.bookB, p.bookC, p.sageSoft, p.linen]
    let n = 0
    for (const y of [0.12, 0.6, 1.08, 1.56]) {
      let x = bx - 0.76
      for (let i = 0; i < 7 && x < bx + 0.7; i++) {
        const w = 0.07 + ((n * 37) % 5) * 0.012
        const h = 0.28 + ((n * 53) % 7) * 0.02
        s.box([w, h, 0.24], books[n % books.length], { pos: [x + w / 2, y + 0.0175 + h / 2, bz], rot: [0, 0, ((n % 4) - 1.5) * 0.01] })
        x += w + 0.012
        n++
      }
    }
    plant(r, bx + 0.55, bz, 0.4, p.sage)
  }

  // Anatomy poster
  const px = 0.1
  const pz = backZ + 0.02
  s.box([0.86, 1.18, 0.03], p.wood, { pos: [px, 1.62, pz] })
  l.box([0.76, 1.08, 0.01], p.linen, { pos: [px, 1.62, pz + 0.02] })
  l.add(new OctahedronGeometry(0.07, 0), p.posterSoft, { pos: [px, 2.0, pz + 0.03], scale: [1, 1.2, 0.2] })
  l.box([0.2, 0.34, 0.01], p.sage, { pos: [px, 1.7, pz + 0.03] })
  l.box([0.06, 0.34, 0.01], p.sage, { pos: [px - 0.17, 1.7, pz + 0.03], rot: [0, 0, 0.12] })
  l.box([0.06, 0.34, 0.01], p.sage, { pos: [px + 0.17, 1.7, pz + 0.03], rot: [0, 0, -0.12] })
  l.box([0.07, 0.38, 0.01], p.sage, { pos: [px - 0.06, 1.33, pz + 0.03] })
  l.box([0.07, 0.38, 0.01], p.sage, { pos: [px + 0.06, 1.33, pz + 0.03] })
  l.box([0.07, 0.07, 0.012], p.posterSoft, { pos: [px - 0.03, 1.78, pz + 0.035] })
  l.box([0.05, 0.1, 0.012], p.sageDeep, { pos: [px + 0.04, 1.62, pz + 0.035] })

  // Desk
  const dx = POLI.desk.x
  const dz = POLI.desk.z
  s.box([1.7, 0.05, 0.85], p.wood, { pos: [dx, 0.745, dz] })
  s.box([0.04, 0.72, 0.8], p.woodDark, { pos: [dx - 0.8, 0.36, dz] })
  s.box([0.5, 0.7, 0.8], p.sage, { pos: [dx + 0.55, 0.36, dz] })
  for (const y of [0.18, 0.4, 0.62]) {
    s.box([0.44, 0.19, 0.02], p.sageSoft, { pos: [dx + 0.55, y, dz + 0.41] })
    s.box([0.12, 0.02, 0.025], p.metal, { pos: [dx + 0.55, y + 0.05, dz + 0.425] })
  }
  s.box([1.2, 0.5, 0.03], p.woodDark, { pos: [dx - 0.2, 0.5, dz - 0.38] })
  // Desk items: laptop, notepad, mug
  s.box([0.36, 0.02, 0.26], p.metal, { pos: [dx - 0.35, 0.78, dz + 0.05] })
  s.box([0.36, 0.24, 0.015], p.metal, { pos: [dx - 0.35, 0.9, dz - 0.08], rot: [-0.25, 0, 0] })
  l.box([0.32, 0.2, 0.008], p.screen, { pos: [dx - 0.35, 0.9, dz - 0.068], rot: [-0.25, 0, 0] })
  s.box([0.2, 0.012, 0.28], p.linen, { pos: [dx + 0.1, 0.776, dz + 0.1], rot: [0, 0.2, 0] })
  if (detail) {
    s.cylinder(0.04, 0.035, 0.09, p.sage, { pos: [dx + 0.35, 0.815, dz - 0.15] }, 8)
    s.cylinder(0.035, 0.035, 0.1, p.wood, { pos: [dx - 0.7, 0.82, dz - 0.25] }, 6)
  }

  // Patient chair and doctor chair
  chair(r, POLI.chair.x, POLI.chair.z, -0.4, 1, p.fabric)
  swivelChair(r, POLI.doctor.x, POLI.doctor.z, Math.PI + 0.45)

  // Exam bed on the right wall
  const b = POLI.bed
  s.box([0.95, 0.1, 2.05], p.metal, { pos: [b.x, 0.5, b.z] })
  for (const sx of [-0.4, 0.4]) {
    for (const sz of [-0.9, 0.9]) s.box([0.06, 0.46, 0.06], p.metal, { pos: [b.x + sx, 0.23, b.z + sz] })
  }
  s.box([0.9, 0.16, 2.0], p.linen, { pos: [b.x, 0.66, b.z] })
  s.box([0.92, 0.012, 2.02], p.sageSoft, { pos: [b.x, 0.748, b.z] })
  s.box([0.5, 0.09, 0.32], p.linen, { pos: [b.x, 0.8, b.z - 0.78] })
  s.box([0.5, 0.5, 0.4], p.sage, { pos: [b.x - 0.1, 0.25, b.z + 1.5] })
  // Tall cabinet beside the bed
  s.box([0.5, 1.7, 0.9], p.wood, { pos: [halfW - 0.3, 0.85, backZ + 0.7] })
  s.box([0.02, 1.5, 0.4], p.sageSoft, { pos: [halfW - 0.56, 0.85, backZ + 0.5] })
  s.box([0.02, 1.5, 0.4], p.sageSoft, { pos: [halfW - 0.56, 0.85, backZ + 0.92] })
  return { solid: s.build(), lit: l.build() }
}

function bed(r: Room, x: number) {
  const { s, p } = r
  const z = ER.bedZ
  // frame, legs, mattress, headboard, rails
  s.box([0.92, 0.1, 1.95], p.metal, { pos: [x, 0.42, z] })
  for (const sx of [-0.4, 0.4]) {
    for (const sz of [-0.85, 0.85]) s.box([0.06, 0.4, 0.06], p.metal, { pos: [x + sx, 0.2, z + sz] })
  }
  s.box([0.88, 0.17, 1.9], p.linen, { pos: [x, 0.605, z] })
  s.box([0.9, 0.012, 0.9], p.sageSoft, { pos: [x, 0.696, z + 0.5] })
  s.box([0.5, 0.09, 0.32], p.linen, { pos: [x, 0.74, ER.headZ - 0.08] })
  s.box([0.95, 0.62, 0.06], p.wood, { pos: [x, 0.78, z - 1.0] })
  s.box([0.95, 0.22, 0.06], p.wood, { pos: [x, 0.55, z + 1.0] })
  for (const sx of [-0.47, 0.47]) s.box([0.03, 0.16, 1.1], p.metal, { pos: [x + sx, 0.82, z - 0.2] })
}

function ivStand(r: Room, x: number, z: number) {
  const { s, p } = r
  s.cylinder(0.014, 0.014, 1.9, p.metal, { pos: [x, 0.95, z] }, 6)
  s.box([0.5, 0.03, 0.06], p.metal, { pos: [x, 0.025, z] })
  s.box([0.06, 0.03, 0.5], p.metal, { pos: [x, 0.025, z] })
  s.box([0.3, 0.02, 0.02], p.metal, { pos: [x, 1.9, z] })
  s.box([0.1, 0.18, 0.035], p.skyLight, { pos: [x - 0.12, 1.77, z] })
  s.box([0.1, 0.18, 0.035], p.linen, { pos: [x + 0.12, 1.77, z] })
  s.box([0.008, 0.6, 0.008], p.skyLight, { pos: [x - 0.12, 1.38, z] })
}

function curtain(r: Room, x: number, backZ: number, length: number) {
  const { s, p } = r
  s.box([0.05, 0.05, length], p.metal, { pos: [x, 2.32, backZ + length / 2] })
  const pleats = 7
  for (let i = 0; i < pleats; i++) {
    const w = length / pleats
    s.box([0.035, 1.95, w * 0.96], i % 2 ? p.sageSoft : p.linen, {
      pos: [x + (i % 2 ? 0.02 : -0.02), 1.3, backZ + w * (i + 0.5)],
    })
  }
}

function monitor(r: Room, x: number, backZ: number) {
  const { s, l, p, detail } = r
  s.box([0.04, 0.04, 0.25], p.metal, { pos: [x, 1.6, backZ + 0.13] })
  s.box([0.5, 0.34, 0.07], p.ink, { pos: [x, 1.5, backZ + 0.27] })
  l.box([0.43, 0.27, 0.01], p.screen, { pos: [x, 1.5, backZ + 0.31] })
  if (detail) {
    const pts = [-0.17, -0.1, -0.06, 0, 0.05, 0.11, 0.17]
    const ys = [0, 0, 0.07, -0.06, 0.04, 0, 0]
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1] - pts[i]
      const dy = ys[i + 1] - ys[i]
      l.box([Math.hypot(dx, dy) + 0.012, 0.012, 0.006], p.screenLine, {
        pos: [x + (pts[i] + pts[i + 1]) / 2, 1.52 + (ys[i] + ys[i + 1]) / 2, backZ + 0.318],
        rot: [0, 0, Math.atan2(dy, dx)],
      })
    }
    l.box([0.12, 0.012, 0.006], p.skyLight, { pos: [x - 0.12, 1.42, backZ + 0.318] })
  }
}

function buildEr(r: Room): RoomGeometry {
  const { s, p, detail } = r
  const { halfW, backZ, frontZ, wallH } = ER
  shell(r, halfW, backZ, frontZ, wallH)

  windowLeft(r, halfW, -0.2, 1.55, 3.4, 1.6)
  for (const bx of ER.bedXs) windowBack(r, backZ, bx, 1.75, 1.6, 1.0)

  for (const bx of ER.bedXs) {
    bed(r, bx)
    monitor(r, bx + 0.72, backZ)
    ivStand(r, bx - 0.68, -2.1)
  }
  curtain(r, -1.2, backZ, 1.7)
  curtain(r, 1.2, backZ, 1.7)
  curtain(r, -3.6, backZ, 1.7)
  curtain(r, 3.6, backZ, 1.7)

  // Triage desk (left foreground)
  const tx = -3.3
  const tz = 0.9
  s.box([2.0, 0.95, 0.55], p.sage, { pos: [tx, 0.475, tz] })
  s.box([2.1, 0.05, 0.65], p.wood, { pos: [tx, 0.975, tz] })
  s.box([1.9, 0.08, 0.02], p.sageSoft, { pos: [tx, 0.6, tz + 0.28] })
  s.box([0.4, 0.26, 0.03], p.ink, { pos: [tx - 0.5, 1.2, tz - 0.05] })
  s.box([0.06, 0.12, 0.06], p.metal, { pos: [tx - 0.5, 1.06, tz - 0.05] })
  r.l.box([0.35, 0.21, 0.01], p.screen, { pos: [tx - 0.5, 1.2, tz - 0.03] })
  s.box([0.3, 0.02, 0.2], p.linen, { pos: [tx + 0.3, 1.01, tz + 0.05] })
  s.cylinder(0.35, 0.35, 0.08, p.fabric, { pos: [tx, 0.55, tz - 0.95] }, 8)
  s.cylinder(0.04, 0.04, 0.5, p.metal, { pos: [tx, 0.25, tz - 0.95] }, 6)

  // Waiting bench and plants
  s.box([1.5, 0.08, 0.5], p.fabric, { pos: [3.4, 0.46, 2.0] })
  s.box([1.5, 0.45, 0.07], p.fabric, { pos: [3.4, 0.75, 1.78] })
  for (const lx of [-0.65, 0.65]) s.box([0.06, 0.42, 0.06], p.wood, { pos: [3.4 + lx, 0.21, 2.0] })
  plant(r, 4.2, -2.55, 1.3)
  plant(r, -4.2, 0.9, 1.1, p.sage)
  if (detail) plant(r, -4.2, -2.6, 0.9, p.sage)
  return { solid: s.build(), lit: r.l.build() }
}

export function buildRoom(mode: SceneMode, palette: ScenePalette, quality: SceneQuality): RoomGeometry {
  const room = new Room(palette, quality === 'high')
  return mode === 'er' ? buildEr(room) : buildPoli(room)
}
