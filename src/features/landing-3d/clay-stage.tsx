import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { readClayPalette, type ClayPalette } from '@/lib/clay-palette'
import { useReducedMotion, usePauseOffscreen } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { QUALITY_PROFILES, qualityForWidth, type ClayQuality } from './budget'
import { ClayContext, type ClayRuntime } from './clay-context'
import { ClayStatsProbe, type ClayStats } from './clay-scene'

let webglSupport: boolean | undefined

export function isWebGLAvailable(): boolean {
  if (webglSupport !== undefined) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    webglSupport = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

class ClayBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function usePalette(): ClayPalette {
  const [palette, setPalette] = useState(() => readClayPalette())
  useEffect(() => {
    const observer = new MutationObserver(() => setPalette(readClayPalette()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    return () => observer.disconnect()
  }, [])
  return palette
}

function useQuality(): ClayQuality {
  const [quality, setQuality] = useState<ClayQuality>(() =>
    typeof window === 'undefined' ? 'high' : qualityForWidth(window.innerWidth),
  )
  useEffect(() => {
    const update = () => setQuality(qualityForWidth(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return quality
}

export interface ClayStageProps {
  children: ReactNode
  fallback: ReactNode
  className?: string
  camera?: { position: [number, number, number]; fov?: number; target?: [number, number, number] }
  /** Overrides the OS / UI-store reduced-motion preference (used by the lab toggle). */
  reducedMotion?: boolean
  onStats?: (stats: ClayStats) => void
}

/**
 * Transparent, decorative WebGL canvas. Frames run only while in view, tab visible and motion
 * allowed; otherwise `frameloop` is 'demand' and the last frame stays on screen.
 */
export function ClayStage({ children, fallback, className, camera, reducedMotion, onStats }: ClayStageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const palette = usePalette()
  const quality = useQuality()
  const systemReduced = useReducedMotion()
  const reduced = reducedMotion ?? systemReduced
  const visible = usePauseOffscreen(ref, '80px')
  const active = visible && !reduced
  const [lost, setLost] = useState(false)
  const webgl = useMemo(() => typeof document !== 'undefined' && isWebGLAvailable(), [])
  const runtime = useMemo<ClayRuntime>(() => ({ palette, quality, active, reduced }), [palette, quality, active, reduced])
  const profile = QUALITY_PROFILES[quality]
  const cam = camera ?? { position: [0, 3.2, 13], fov: 28 }

  const showFallback = !webgl || lost
  return (
    <div ref={ref} className={cn('relative size-full', className)} aria-hidden="true">
      {showFallback ? (
        fallback
      ) : (
        <ClayBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Canvas
              key={quality}
              className="!absolute inset-0"
              dpr={[1, profile.dprMax]}
              frameloop={active ? 'always' : 'demand'}
              camera={{ position: cam.position, fov: cam.fov ?? 28, near: 0.5, far: 60 }}
              gl={{ alpha: true, antialias: true, powerPreference: 'default', toneMapping: ACESFilmicToneMapping }}
              onCreated={({ gl, camera: c }) => {
                gl.setClearColor(0x000000, 0)
                gl.toneMappingExposure = 1.3
                c.lookAt(...(cam.target ?? [0, 0.4, 0]))
                gl.domElement.addEventListener('webglcontextlost', (e) => {
                  e.preventDefault()
                  setLost(true)
                })
              }}
              style={{ pointerEvents: 'none' }}
            >
              <ClayContext.Provider value={runtime}>
                {children}
                {onStats && <ClayStatsProbe onStats={onStats} />}
              </ClayContext.Provider>
            </Canvas>
          </Suspense>
        </ClayBoundary>
      )}
    </div>
  )
}
