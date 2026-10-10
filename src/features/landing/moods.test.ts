import { describe, expect, it } from 'vitest'
import { EMOTIONS } from '@/lib/emotion'
import { translate } from '@/lib/i18n'
import './i18n'
import { browTransform, FACE, mouthPath, stepMood } from './moods'

describe('mood face parameters', () => {
  it('defines a face for each of the 8 emotions', () => {
    expect(Object.keys(FACE).sort()).toEqual([...EMOTIONS].sort())
    expect(EMOTIONS).toHaveLength(8)
  })

  it('draws an open mouth as a closed filled shape and a closed mouth as a single stroke', () => {
    expect(mouthPath(FACE.netral.curve, FACE.netral.open)).not.toContain('Z')
    expect(mouthPath(FACE.senang.curve, FACE.senang.open)).toContain('Z')
  })

  it('bends the mouth up for a smile and down for a frown', () => {
    const ctrlY = (d: string) => Number(d.match(/Q50 ([\d.-]+)/)![1])
    const endY = (d: string) => Number(d.match(/^M35 ([\d.-]+)/)![1])
    const smile = mouthPath(0.85, 0)
    const frown = mouthPath(-0.7, 0)
    expect(ctrlY(smile)).toBeGreaterThan(endY(smile))
    expect(ctrlY(frown)).toBeLessThan(endY(frown))
  })

  it('mirrors brow rotation so both inner ends rise for worry and drop for anger', () => {
    const worriedL = browTransform(-1, 18, 0.2)
    const worriedR = browTransform(1, 18, 0.2)
    expect(worriedL.rotate).toBe(-18)
    expect(worriedR.rotate).toBe(18)
    const angryL = browTransform(-1, -26, 0.06)
    expect(angryL.rotate).toBe(26)
    expect(angryL.y).toBeGreaterThan(worriedL.y)
  })

  it('has a quote and a cause in both languages for every mood', () => {
    for (const locale of ['id', 'en'] as const) {
      for (const e of EMOTIONS) {
        expect(translate(locale, `landing.emotion.${e}.quote`)).not.toBe(`landing.emotion.${e}.quote`)
        expect(translate(locale, `landing.emotion.${e}.cause`)).not.toBe(`landing.emotion.${e}.cause`)
      }
    }
  })
})

describe('stepMood', () => {
  it('moves through the picker order and wraps at both ends', () => {
    expect(stepMood('netral', 1)).toBe('cemas')
    expect(stepMood('senang', 1)).toBe('netral')
    expect(stepMood('netral', -1)).toBe('senang')
    expect(stepMood('marah', -1)).toBe('sedih')
  })
})
