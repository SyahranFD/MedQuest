import type { BufferGeometry } from 'three'

export type ClayQuality = 'high' | 'low'

export interface QualityProfile {
  /** Multiplier on geometry segment counts. */
  segments: number
  dprMax: number
  shadowResolution: number
  /** Satellite objects in the hero composition. */
  heroSatellites: number
  environmentResolution: number
}

export const DPR_MAX = 1.75
export const TRIANGLES_PER_OBJECT = 1500
export const TRIANGLES_PER_SCENE = 6000

export const QUALITY_PROFILES: Record<ClayQuality, QualityProfile> = {
  high: { segments: 1, dprMax: DPR_MAX, shadowResolution: 512, heroSatellites: 5, environmentResolution: 64 },
  low: { segments: 0.6, dprMax: 1.5, shadowResolution: 256, heroSatellites: 4, environmentResolution: 32 },
}

export const MOBILE_MAX_WIDTH = 768

export function qualityForWidth(width: number): ClayQuality {
  return width > 0 && width < MOBILE_MAX_WIDTH ? 'low' : 'high'
}

/** Scale a segment count by quality, never below `min` so shapes stay round enough. */
export function seg(quality: ClayQuality, count: number, min = 3): number {
  return Math.max(min, Math.round(count * QUALITY_PROFILES[quality].segments))
}

export function clampDpr(devicePixelRatio: number, max: number): number {
  return Math.min(Math.max(devicePixelRatio, 1), max)
}

export function countTriangles(geometry: BufferGeometry): number {
  const count = geometry.index ? geometry.index.count : geometry.getAttribute('position').count
  return Math.floor(count / 3)
}

export const withinBudget = (triangles: number, budget: number) => triangles <= budget
