import { describe, expect, it } from 'vitest'
import { BAND_VARIANT } from './band'

describe('BAND_VARIANT', () => {
  it('gives each verdict its own hue and keeps pass off gray', () => {
    expect(BAND_VARIANT.excellent).toBe('success')
    expect(BAND_VARIANT.pass).toBe('info')
    expect(BAND_VARIANT.borderline).toBe('warning')
    expect(BAND_VARIANT['clear-fail']).toBe('danger')
    expect(Object.values(BAND_VARIANT)).not.toContain('neutral')
    expect(BAND_VARIANT.pass).not.toBe(BAND_VARIANT.good)
  })
})
