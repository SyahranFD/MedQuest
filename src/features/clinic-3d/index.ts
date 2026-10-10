// Public API of the 3D clinic. Everything exported here is light: the three.js chunk is only
// loaded (dynamic import) when <ClinicSceneLazy /> renders.
export { ClinicSceneLazy } from './clinic-scene-lazy'
export { SceneFallback } from './scene-fallback'
export { SceneSkeleton } from './scene-skeleton'
export { hasWebGL } from './webgl'
export { EMOTION_PARAMS } from './expression'
export type { ClinicSceneViewProps, SceneShot, SceneStats } from './types'
