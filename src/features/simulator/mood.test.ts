import { describe, expect, it } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { createSession } from '@/features/session/er-engine'
import { abnormalVitals, patientStatus, seededShuffle, unfinishedItems } from './case-meta'
import { formatDelta, reasonKey, tintFor } from './mood'

describe('trust delta display', () => {
  it('formats signs and fractions, hides noise', () => {
    expect(formatDelta(5)).toBe('+5')
    expect(formatDelta(-3)).toBe('-3')
    expect(formatDelta(-0.5)).toBe('-0.5')
    expect(formatDelta(0)).toBeNull()
    expect(formatDelta(undefined)).toBeNull()
  })

  it('tints the stage only on big changes', () => {
    expect(tintFor(4)).toBe('good')
    expect(tintFor(-10)).toBe('bad')
    expect(tintFor(2)).toBeNull()
  })

  it('explains the change with the most specific reason first', () => {
    expect(reasonKey({ withheld: true, tone: 'empatik' })).toBe('withheld')
    expect(reasonKey({ interrupted: true, tone: 'netral' })).toBe('interrupted')
    expect(reasonKey({ tone: 'menghakimi' })).toBe('menghakimi')
    expect(reasonKey({ tone: 'netral', trustDelta: -1 })).toBe('streak')
    expect(reasonKey({})).toBeNull()
  })
})

describe('case meta', () => {
  it('derives bed status from severity and stage', () => {
    expect(patientStatus({ status: 'in-bed', stage: 0 }, 'stable')).toBe('stabil')
    expect(patientStatus({ status: 'in-bed', stage: 1 }, 'critical')).toBe('memburuk')
    expect(patientStatus({ status: 'in-bed', stage: 2 }, 'urgent')).toBe('kritis')
    expect(patientStatus({ status: 'deceased', stage: 3 }, 'urgent')).toBe('meninggal')
    expect(patientStatus({ status: 'discharged', stage: 0 }, 'urgent')).toBe('selesai')
  })

  it('flags abnormal vitals', () => {
    const a = abnormalVitals({ hr: 120, sbp: 90, dbp: 70, rr: 24, spo2: 97, temp: 37.2, gcs: 15 })
    expect(a.hr && a.sbp && a.rr).toBe(true)
    expect(a.spo2 || a.temp || a.gcs).toBe(false)
  })

  it('shuffles deterministically without losing items', () => {
    const list = ['a', 'b', 'c', 'd', 'e']
    expect(seededShuffle(list, 'x')).toEqual(seededShuffle(list, 'x'))
    expect([...seededShuffle(list, 'x')].sort()).toEqual(list)
  })

  it('lists unfinished work for the end dialog', () => {
    const s = createSession({ mode: 'poli', cases: [requireCase('poli-hipertensi')] })
    expect(unfinishedItems(s).map((i) => i.key)).toEqual(['noDiagnosis', 'noDisposition'])
  })
})
