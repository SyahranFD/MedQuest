// Shared contract between the dialogue engine (features/dialogue, features/session) and the 3D
// scene (features/clinic-3d). Do not add imports from features/ here.

export const EMOTIONS = [
  'netral',
  'cemas',
  'sakit',
  'sedih',
  'marah',
  'bingung',
  'lega',
  'senang',
] as const

export type Emotion = (typeof EMOTIONS)[number]

export type PatientPose = 'walking' | 'standing' | 'sitting' | 'lying'

/** Everything the 3D scene needs to draw one patient. Pure data, no behavior. */
export interface PatientVisual {
  /** Deterministic seed (usually the case id): same seed gives same skin, hair, build, accessories. */
  seed: string
  age: number
  gender: 'M' | 'F'
  emotion: Emotion
  /** 0 (barely) to 1 (strongly) expressed. */
  intensity: number
  /** True while the patient is speaking a reply; drives the 3-viseme mouth cycle. */
  talking: boolean
  pose: PatientPose
}

/** Patient state owned by the session engine; the scene only reads the derived visual. */
export interface PatientEmotionState {
  /** 0 to 100. Low trust withholds sensitive answers. */
  trust: number
  mood: Emotion
  /** 0 to 1. */
  pain: number
  /** 0 to 1, falls while the patient waits. */
  patience: number
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
