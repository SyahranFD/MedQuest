import { deriveTraits, hashSeed, makeRng } from './traits'

describe('deriveTraits', () => {
  it('is deterministic for the same seed', () => {
    const a = deriveTraits({ seed: 'case-dbd-01', age: 24, gender: 'F' })
    const b = deriveTraits({ seed: 'case-dbd-01', age: 24, gender: 'F' })
    expect(a).toEqual(b)
  })

  it('varies across seeds', () => {
    const keys = new Set<string>()
    for (let i = 0; i < 40; i++) keys.add(JSON.stringify(deriveTraits({ seed: `s${i}`, age: 30, gender: 'M' })))
    expect(keys.size).toBeGreaterThan(20)
  })

  it('respects age and gender constraints', () => {
    for (let i = 0; i < 80; i++) {
      const man = deriveTraits({ seed: `m${i}`, age: 70, gender: 'M' })
      expect(man.hairStyle).not.toBe('hijab')
      const kid = deriveTraits({ seed: `k${i}`, age: 6, gender: 'F' })
      expect(kid.heightScale).toBeLessThan(0.8)
      expect(kid.accessory).not.toBe('peci')
    }
  })

  it('hashes and random streams are stable', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
    const r1 = makeRng(5)
    const r2 = makeRng(5)
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()])
  })
})
