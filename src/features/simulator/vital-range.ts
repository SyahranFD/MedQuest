import type { Vitals } from '@/features/cases/types'

export type VitalKey = 'hr' | 'bp' | 'rr' | 'spo2' | 'temp' | 'gcs'

/** `mild` is borderline (amber), `high` is coral-red, `low` is sky blue. */
export type VitalLevel = 'normal' | 'mild' | 'high' | 'low'

export interface VitalStatus {
  level: VitalLevel
  /** i18n key (simulator namespace) of the condition chip; null when normal. */
  labelKey: string | null
}

const NORMAL: VitalStatus = { level: 'normal', labelKey: null }
const flag = (level: Exclude<VitalLevel, 'normal'>, key: string): VitalStatus => ({ level, labelKey: `vital.flag.${key}` })

/** Adult reference ranges for the vitals chips. Training reference only, not a clinical threshold table. */
export function vitalStatus(key: VitalKey, v: Vitals): VitalStatus {
  switch (key) {
    case 'hr':
      return v.hr > 100 ? flag('high', 'tachycardia') : v.hr < 60 ? flag('low', 'bradycardia') : NORMAL
    case 'bp':
      if (v.sbp >= 140 || v.dbp >= 90) return flag('high', 'hypertension')
      if (v.sbp < 90 || v.dbp < 60) return flag('low', 'hypotension')
      return NORMAL
    case 'rr':
      return v.rr > 20 ? flag('high', 'tachypnea') : v.rr < 12 ? flag('low', 'bradypnea') : NORMAL
    case 'spo2':
      return v.spo2 < 92 ? flag('low', 'low') : v.spo2 < 95 ? flag('mild', 'lowMild') : NORMAL
    case 'temp':
      if (v.temp >= 38.5) return flag('high', 'fever')
      if (v.temp > 37.5) return flag('mild', 'feverMild')
      return v.temp < 36.1 ? flag('low', 'low') : NORMAL
    case 'gcs':
      return v.gcs < 15 ? flag('high', 'gcsLow') : NORMAL
  }
}

export const LEVEL_VARIANT = { high: 'danger', low: 'info', mild: 'warning' } as const
