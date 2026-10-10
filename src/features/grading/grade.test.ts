import { describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { bandForPercent, grade, BAND_RANK } from './grade'
import { GUIDELINES, GUIDELINE_IDS, citationFor, getGuideline } from './guidelines'
import { evalPred } from './predicates'
import { buildScriptedLog } from './scripted-logs'
import { DIMENSIONS } from '@/features/cases/types'
import { acsCase } from '@/features/cases/data/acs'
import { tbCase } from '@/features/cases/data/tb'
import { createLog } from '@/features/session/helpers'

describe('guideline registry', () => {
  it('has unique ids, a verify flag, and years only when set explicitly', () => {
    expect(new Set(GUIDELINE_IDS).size).toBe(GUIDELINES.length)
    expect(GUIDELINES.every((g) => g.verifyBeforeRealUse === true)).toBe(true)
    expect(getGuideline('perkeni-dm2-2021')?.year).toBe(2021)
    expect(getGuideline('kemenkes-pnpk-tb')?.year).toBeUndefined()
    expect(citationFor('nope')).toBeUndefined()
  })
})

describe('band thresholds', () => {
  it('maps percent to bands', () => {
    expect(bandForPercent(95)).toBe('excellent')
    expect(bandForPercent(80)).toBe('good')
    expect(bandForPercent(65)).toBe('pass')
    expect(bandForPercent(45)).toBe('borderline')
    expect(bandForPercent(10)).toBe('clear-fail')
  })
})

describe('grader on scripted playthroughs', () => {
  for (const c of ALL_CASES) {
    describe(c.id, () => {
      it('perfect log is excellent with no breach and every criterion met', () => {
        const ev = grade(buildScriptedLog(c, 'perfect'), c)
        expect(ev.band, JSON.stringify(ev.criteria.filter((x) => x.verdict !== 'met').map((x) => x.id))).toBe('excellent')
        expect(ev.percent).toBe(100)
        expect(ev.breaches).toHaveLength(0)
        expect(ev.capped).toBe(false)
        for (const d of DIMENSIONS) expect(ev.dimensions[d].raw).toBe(ev.dimensions[d].max)
        expect(ev.empathyScore).toBeGreaterThan(60)
        expect(ev.timeline.length).toBeGreaterThan(5)
        expect(ev.synthetic).toBe(true)
      })

      it('bad log is a clear fail led by a safety breach', () => {
        const ev = grade(buildScriptedLog(c, 'bad'), c)
        expect(ev.band).toBe('clear-fail')
        expect(ev.breaches.length).toBeGreaterThan(0)
        expect(ev.improvements[0]).toContain('Prioritas keselamatan')
        expect(ev.empathyScore).toBeLessThan(30)
        expect(ev.narrative).toContain('Perhatian utama')
      })

      it('average log lands between bad and perfect', () => {
        const ev = grade(buildScriptedLog(c, 'average'), c)
        expect(ev.percent).toBeLessThan(100)
        expect(ev.percent).toBeGreaterThan(grade(buildScriptedLog(c, 'bad'), c).percent)
        expect(BAND_RANK[ev.band]).toBeGreaterThanOrEqual(BAND_RANK.borderline)
      })

      it('only cites registry ids', () => {
        const ev = grade(buildScriptedLog(c, 'bad'), c)
        for (const cr of ev.criteria) if (cr.cite) expect(GUIDELINE_IDS).toContain(cr.cite.id)
        for (const b of ev.breaches) if (b.cite) expect(GUIDELINE_IDS).toContain(b.cite.id)
      })

      it('is deterministic', () => {
        const log = buildScriptedLog(c, 'average')
        expect(grade(log, c)).toEqual(grade(log, c))
      })
    })
  }
})

describe('safety cap and death', () => {
  it('a breach caps an otherwise strong log at borderline', () => {
    const log = buildScriptedLog(tbCase, 'perfect')
    log.treatments.push({ id: 'levofloksasin', atSec: 99 })
    const ev = grade(log, tbCase)
    expect(ev.percent).toBeGreaterThanOrEqual(90)
    expect(ev.capped).toBe(true)
    expect(ev.band).toBe('borderline')
    expect(ev.breaches[0].cite?.id).toBe('kemenkes-pnpk-tb')
  })

  it('death forces clear fail and adds a breach', () => {
    const log = buildScriptedLog(acsCase, 'perfect')
    log.outcome = 'deceased'
    const ev = grade(log, acsCase)
    expect(ev.band).toBe('clear-fail')
    expect(ev.breaches.some((b) => b.id === 'death')).toBe(true)
    expect(ev.criteria.find((c) => c.id === 'ks-03')?.verdict).toBe('missed')
  })

  it('an empty log fails and shows what was missing', () => {
    const ev = grade(createLog(tbCase.id, 0), tbCase)
    expect(ev.band).toBe('clear-fail')
    expect(ev.criteria.every((c) => c.verdict !== 'met' || c.id === 'kom-06' || c.id === 'ks-01')).toBe(true)
    expect(ev.criteria.find((c) => c.id === 'pn-01')?.evidence).toContain('Tidak ada yang terdeteksi')
  })
})

describe('predicates', () => {
  const log = buildScriptedLog(acsCase, 'perfect')

  it('evaluates timing, ordering and composition', () => {
    expect(evalPred({ kind: 'treated', anyOf: ['aspirin-load'], withinSec: 300 }, log, acsCase)).toBe(true)
    expect(evalPred({ kind: 'treated', anyOf: ['aspirin-load'], withinSec: 1 }, log, acsCase)).toBe(false)
    expect(evalPred({ kind: 'orderedBefore', first: 'ekg', then: 'troponin' }, log, acsCase)).toBe(true)
    expect(evalPred({ kind: 'orderedBefore', first: 'troponin', then: 'ekg' }, log, acsCase)).toBe(false)
    expect(evalPred({ kind: 'not', of: { kind: 'survived' } }, log, acsCase)).toBe(false)
    expect(evalPred({ kind: 'any', of: [{ kind: 'diagnosis', equals: 'nstemi' }, { kind: 'diagnosis', equals: 'correct' }] }, log, acsCase)).toBe(true)
    expect(evalPred({ kind: 'trustAtLeast', value: 80 }, log, acsCase)).toBe(true)
  })

  it('counts a repeated question once', () => {
    const l = createLog(acsCase.id, 0)
    l.askedIds.push({ id: 'onset', atSec: 1, via: 'click' }, { id: 'onset', atSec: 2, via: 'chat' })
    expect(evalPred({ kind: 'asked', anyOf: ['onset', 'karakter'], min: 2 }, l, acsCase)).toBe(false)
  })
})
