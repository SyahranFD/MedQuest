import { describe, expect, it } from 'vitest'
import type { Vitals } from '@/features/cases/types'
import { vitalStatus, type VitalKey } from './vital-range'

const OK: Vitals = { hr: 80, sbp: 120, dbp: 80, rr: 16, spo2: 98, temp: 36.8, gcs: 15 }

describe('vitalStatus', () => {
  const cases: [VitalKey, Partial<Vitals>, string, string | null][] = [
    ['hr', {}, 'normal', null],
    ['hr', { hr: 60 }, 'normal', null],
    ['hr', { hr: 100 }, 'normal', null],
    ['hr', { hr: 101 }, 'high', 'vital.flag.tachycardia'],
    ['hr', { hr: 59 }, 'low', 'vital.flag.bradycardia'],
    ['bp', { sbp: 139, dbp: 89 }, 'normal', null],
    ['bp', { sbp: 140 }, 'high', 'vital.flag.hypertension'],
    ['bp', { dbp: 90 }, 'high', 'vital.flag.hypertension'],
    ['bp', { sbp: 89 }, 'low', 'vital.flag.hypotension'],
    ['bp', { dbp: 59 }, 'low', 'vital.flag.hypotension'],
    ['rr', { rr: 12 }, 'normal', null],
    ['rr', { rr: 21 }, 'high', 'vital.flag.tachypnea'],
    ['rr', { rr: 11 }, 'low', 'vital.flag.bradypnea'],
    ['spo2', { spo2: 95 }, 'normal', null],
    ['spo2', { spo2: 94 }, 'mild', 'vital.flag.lowMild'],
    ['spo2', { spo2: 92 }, 'mild', 'vital.flag.lowMild'],
    ['spo2', { spo2: 91 }, 'low', 'vital.flag.low'],
    ['temp', { temp: 36.1 }, 'normal', null],
    ['temp', { temp: 37.5 }, 'normal', null],
    ['temp', { temp: 37.6 }, 'mild', 'vital.flag.feverMild'],
    ['temp', { temp: 38.4 }, 'mild', 'vital.flag.feverMild'],
    ['temp', { temp: 38.5 }, 'high', 'vital.flag.fever'],
    ['temp', { temp: 36.0 }, 'low', 'vital.flag.low'],
    ['gcs', { gcs: 15 }, 'normal', null],
    ['gcs', { gcs: 14 }, 'high', 'vital.flag.gcsLow'],
  ]
  it.each(cases)('%s %j is %s', (key, patch, level, labelKey) => {
    expect(vitalStatus(key, { ...OK, ...patch })).toEqual({ level, labelKey })
  })
})
