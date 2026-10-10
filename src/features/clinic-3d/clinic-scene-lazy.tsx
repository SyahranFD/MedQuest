import { lazy, Suspense } from 'react'
import { useClinicCopy } from './copy'
import { SceneBoundary } from './scene-boundary'
import { SceneFallback } from './scene-fallback'
import { SceneSkeleton } from './scene-skeleton'
import type { ClinicSceneViewProps } from './types'
import { hasWebGL } from './webgl'

// The three.js chunk is a dynamic import: nothing heavy loads until a scene is rendered.
const ClinicScene = lazy(() => import('./clinic-scene'))

/**
 * Public entry point. Shows a skeleton while the 3D chunk loads and a static illustration when
 * WebGL is unavailable or the scene throws. Needs a positioned parent with a size.
 */
export function ClinicSceneLazy(props: ClinicSceneViewProps) {
  const copy = useClinicCopy()
  const { className, mode, patients, activePatientId, onSelectPatient } = props
  const fallback = (
    <SceneFallback
      mode={mode}
      patients={patients}
      activePatientId={activePatientId}
      className="absolute inset-0"
    />
  )
  return (
    <div className={className ?? 'relative size-full min-h-64 overflow-hidden rounded-[inherit]'}>
      {hasWebGL() ? (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={<SceneSkeleton />}>
            <ClinicScene {...props} className={undefined} />
          </Suspense>
        </SceneBoundary>
      ) : (
        fallback
      )}
      {onSelectPatient && (
        <ul className="sr-only">
          {patients.map((p, i) => (
            <li key={p.id}>
              <button type="button" onClick={() => onSelectPatient(p.id)}>
                {copy.selectPatient} {i + 1}
                {p.statusLabel ? `, ${p.statusLabel}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
