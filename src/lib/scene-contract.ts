import type { PatientVisual } from '@/lib/emotion'

// Contract between the simulator screens (features/simulator) and the 3D clinic
// (features/clinic-3d). The scene is a pure view: it receives props and emits callbacks.

export type SceneMode = 'er' | 'poli'
export type SceneQuality = 'high' | 'low'

export interface ScenePatient {
  /** Stable id (session patient id). */
  id: string
  /** ER only: which bed (0-based). Poli uses the single consultation chair. */
  bedIndex?: number
  visual: PatientVisual
  /** ER only: short status label shown in a tiny world-space tag (for example "Kritis"). */
  statusLabel?: string
  /** Tag color: danger for critical or deceased, warning for worsening. Neutral when omitted. */
  statusTone?: 'warning' | 'danger'
}

export interface ClinicSceneProps {
  mode: SceneMode
  patients: ScenePatient[]
  /** Patient currently being examined; the camera frames them. */
  activePatientId: string | null
  onSelectPatient?: (patientId: string) => void
  quality?: SceneQuality
  /** Respect the user's reduced-motion preference: no walking sway, no camera drift. */
  reducedMotion?: boolean
}
