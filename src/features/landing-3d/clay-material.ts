import { CanvasTexture, Color, LinearMipmapLinearFilter, MeshPhysicalMaterial, NoColorSpace, RepeatWrapping } from 'three'
import type { Texture } from 'three'

/** Soft, tileable, procedural noise (a few blurred octaves) used only as a very subtle bump. */
function createNoiseTexture(size = 128): Texture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let seed = 1337
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  ctx.fillStyle = 'rgb(128 128 128)'
  ctx.fillRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  for (const [cells, alpha] of [[8, 0.5], [16, 0.35], [32, 0.2]] as const) {
    const small = document.createElement('canvas')
    small.width = small.height = cells
    const sctx = small.getContext('2d')
    if (!sctx) continue
    const img = sctx.createImageData(cells, cells)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rand() * 255)
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    sctx.putImageData(img, 0, 0)
    ctx.globalAlpha = alpha
    ctx.drawImage(small, 0, 0, size, size)
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.colorSpace = NoColorSpace
  texture.minFilter = LinearMipmapLinearFilter
  texture.anisotropy = 4
  return texture
}

export interface ClayMaterialOptions {
  roughness?: number
  clearcoat?: number
  bumpScale?: number
}

/**
 * The one shared clay material: matte-soft MeshPhysical, sheen at grazing angles, a thin
 * clearcoat and a faint procedural bump. Color comes from per-vertex colors (one draw call
 * per object), so a single material instance serves the whole page.
 */
export function createClayMaterial({ roughness = 0.62, clearcoat = 0.15, bumpScale = 0.35 }: ClayMaterialOptions = {}) {
  const noise = createNoiseTexture()
  return new MeshPhysicalMaterial({
    vertexColors: true,
    roughness,
    metalness: 0,
    clearcoat,
    clearcoatRoughness: 0.5,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new Color(1, 1, 1).lerp(new Color(0.78, 0.92, 0.85), 0.4),
    specularIntensity: 0.5,
    envMapIntensity: 0.7,
    bumpMap: noise,
    bumpScale: noise ? bumpScale : 0,
  })
}

let shared: MeshPhysicalMaterial | null = null

export function getClayMaterial(): MeshPhysicalMaterial {
  shared ??= createClayMaterial()
  return shared
}
