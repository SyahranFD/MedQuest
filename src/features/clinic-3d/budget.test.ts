import type { PatientPose } from '@/lib/emotion'
import { BUDGET, characterDrawCalls, characterTriangles, checkBudget } from './budget'
import { buildCharacterGeometry, type Lod } from './character-geometry'
import { buildPalette } from './palette'
import { deriveTraits } from './traits'

const palette = buildPalette()
const poses: PatientPose[] = ['walking', 'standing', 'sitting', 'lying']
const lods: Lod[] = ['hero', 'standard', 'low']

describe('character triangle budget', () => {
  it('keeps every seed, pose and outfit under the hero budget', () => {
    let worst = 0
    for (let i = 0; i < 60; i++) {
      const traits = deriveTraits({ seed: `case-${i}`, age: 8 + i, gender: i % 2 ? 'F' : 'M' })
      for (const pose of poses) {
        const patient = characterTriangles(buildCharacterGeometry(palette, traits, pose, 'patient', 'hero'))
        worst = Math.max(worst, patient)
        expect(patient).toBeLessThanOrEqual(BUDGET.patientTriangles)
        // The doctor is never a close-up, so it uses the standard head.
        const doctor = characterTriangles(buildCharacterGeometry(palette, traits, pose, 'doctor', 'standard'))
        expect(doctor).toBeLessThanOrEqual(BUDGET.patientTriangles)
      }
    }
    expect(worst).toBeGreaterThan(300)
  })

  it('gets cheaper at lower levels of detail', () => {
    const traits = deriveTraits({ seed: 'lod', age: 30, gender: 'M' })
    const counts = lods.map((lod) => characterTriangles(buildCharacterGeometry(palette, traits, 'standing', 'patient', lod)))
    expect(counts[0]).toBeGreaterThan(counts[1])
    expect(counts[1]).toBeGreaterThan(counts[2])
  })
})

describe('budget helpers', () => {
  it('flags a scene over the limits', () => {
    expect(checkBudget(5000, 20)).toMatchObject({ withinTriangles: true, withinDrawCalls: true })
    expect(checkBudget(7000, 20).withinTriangles).toBe(false)
    expect(checkBudget(5000, 30).withinDrawCalls).toBe(false)
  })

  it('counts character draw calls', () => {
    expect(characterDrawCalls(false, 0)).toBe(4)
    expect(characterDrawCalls(true, 1)).toBe(6)
  })
})
