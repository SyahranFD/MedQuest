import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { usePauseOffscreen, useReducedMotion } from '@/lib/motion'
import { useClinicCopy } from './copy'
import { disposeCharacterAssets } from './character'
import { disposeFxKit } from './fx'
import { disposeSceneAssets, SceneContent } from './scene-content'
import type { ClinicSceneViewProps } from './types'

const MAX_DPR = 1.75

/** The heavy module: Canvas, lights, room, characters. Load it through `ClinicSceneLazy`. */
export default function ClinicScene({
  mode,
  patients,
  activePatientId,
  onSelectPatient,
  quality = 'high',
  reducedMotion,
  shot = 'medium',
  onStats,
  adaptive = true,
  className,
}: ClinicSceneViewProps) {
  const copy = useClinicCopy()
  const prefersReduced = useReducedMotion()
  const reduced = reducedMotion ?? prefersReduced
  const ref = useRef<HTMLDivElement>(null)
  const inView = usePauseOffscreen(ref)
  const [degraded, setDegraded] = useState(false)
  const [lost, setLost] = useState(false)
  const [dprCap, setDprCap] = useState(MAX_DPR)

  useEffect(
    () => () => {
      disposeCharacterAssets()
      disposeFxKit()
      disposeSceneAssets()
    },
    [],
  )

  if (lost) throw new Error('WebGL context lost')

  const effective = quality === 'low' || (adaptive && degraded) ? 'low' : 'high'
  const dpr = effective === 'low' ? 1 : dprCap
  const animating = (!reduced && patients.length > 0) || patients.some((p) => p.visual.talking)
  const frameloop = !inView ? 'never' : animating ? 'always' : 'demand'

  return (
    <div ref={ref} className={className ?? 'absolute inset-0'} role="img" aria-label={mode === 'er' ? copy.labelEr : copy.labelPoli}>
      <Canvas
        frameloop={frameloop}
        dpr={effective === 'low' ? 1 : [1, dprCap]}
        camera={{ fov: 34, near: 0.1, far: 60, position: [0, 2, 7] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.toneMappingExposure = 1.22
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            setLost(true)
          })
        }}
      >
        {adaptive && (
          <PerformanceMonitor
            flipflops={3}
            onChange={({ factor }) => setDprCap(1 + (MAX_DPR - 1) * factor)}
            onDecline={() => setDegraded(true)}
            onFallback={() => setDegraded(true)}
          />
        )}
        <SceneContent
          mode={mode}
          patients={patients}
          activePatientId={activePatientId}
          onSelectPatient={onSelectPatient}
          quality={effective}
          reducedMotion={reduced}
          shot={shot}
          dpr={dpr}
          onStats={onStats}
        />
      </Canvas>
    </div>
  )
}
