import type { ClinicSceneProps } from '@/lib/scene-contract'

/** Camera framing: the whole room, the patient from the chest up, or a face close-up. */
export type SceneShot = 'wide' | 'medium' | 'face'

export interface SceneStats {
  triangles: number
  drawCalls: number
  geometries: number
  /** Quality actually in use (the PerformanceMonitor may lower it). */
  quality: 'high' | 'low'
  dpr: number
}

/** Props of the 3D clinic: the shared contract plus view-only options. */
export interface ClinicSceneViewProps extends ClinicSceneProps {
  /** Default 'medium'. Without an active patient the camera shows the whole room. */
  shot?: SceneShot
  /** Called about twice a second with renderer.info numbers (lab and debugging). */
  onStats?: (stats: SceneStats) => void
  /** Let the PerformanceMonitor lower quality and DPR on slow frames. Default true. */
  adaptive?: boolean
  className?: string
}
