import { CLAY_FALLBACK, CLAY_TOKENS, parseCssColor, readClayPalette, resolveClayPalette } from './clay-palette'

describe('parseCssColor', () => {
  it('normalises hex and rgb values', () => {
    expect(parseCssColor(' #3F9D7D ', '#000000')).toBe('#3f9d7d')
    expect(parseCssColor('#abc', '#000000')).toBe('#aabbcc')
    expect(parseCssColor('rgb(63, 157, 125)', '#000000')).toBe('#3f9d7d')
    expect(parseCssColor('rgb(63 157 125 / 0.5)', '#000000')).toBe('#3f9d7d')
  })

  it('falls back for empty, missing or unsupported values', () => {
    for (const raw of ['', '   ', undefined, null, 'var(--x)', 'color-mix(in srgb, red, blue)', 'banana', '#12']) {
      expect(parseCssColor(raw, '#123456')).toBe('#123456')
    }
  })
})

describe('resolveClayPalette', () => {
  it('reads every token and falls back per token', () => {
    const palette = resolveClayPalette((token) => (token === CLAY_TOKENS.green ? '#112233' : ''))
    expect(palette.green).toBe('#112233')
    expect(palette.coral).toBe(CLAY_FALLBACK.coral)
  })

  it('reads CSS variables from the document', () => {
    document.documentElement.style.setProperty('--mq-clay-sky', '#010203')
    expect(readClayPalette().sky).toBe('#010203')
    document.documentElement.style.removeProperty('--mq-clay-sky')
    expect(readClayPalette().sky).toBe(CLAY_FALLBACK.sky)
  })
})
