export interface ClayPalette {
  green: string
  cream: string
  sky: string
  coral: string
  butter: string
  primary: string
  ink: string
  tint: string
  surface: string
}

export const CLAY_TOKENS: Record<keyof ClayPalette, string> = {
  green: '--mq-clay-green',
  cream: '--mq-clay-cream',
  sky: '--mq-clay-sky',
  coral: '--mq-clay-coral',
  butter: '--mq-clay-butter',
  primary: '--mq-primary',
  ink: '--mq-ink-2',
  tint: '--mq-tint-green',
  surface: '--mq-surface',
}

// Only used when a token cannot be read (SSR, tests, a stripped stylesheet).
export const CLAY_FALLBACK: ClayPalette = {
  green: '#3f9d7d',
  cream: '#f3ede1',
  sky: '#7fb0d8',
  coral: '#e58c7f',
  butter: '#f0cf7a',
  primary: '#2a8266',
  ink: '#455a50',
  tint: '#e4f0ea',
  surface: '#fdfefd',
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const RGB = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+[\d.]+%?)?\s*\)$/i

const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')

/** Normalise a raw custom-property value to `#rrggbb`, or return the fallback. */
export function parseCssColor(raw: string | null | undefined, fallback: string): string {
  const value = (raw ?? '').trim()
  if (HEX.test(value)) {
    const h = value.slice(1).toLowerCase()
    return h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h}`
  }
  const m = RGB.exec(value)
  if (m) return `#${toHex(Number(m[1]))}${toHex(Number(m[2]))}${toHex(Number(m[3]))}`
  return fallback
}

export function resolveClayPalette(read: (token: string) => string | null | undefined): ClayPalette {
  const out = { ...CLAY_FALLBACK }
  for (const key of Object.keys(CLAY_TOKENS) as (keyof ClayPalette)[]) {
    out[key] = parseCssColor(read(CLAY_TOKENS[key]), CLAY_FALLBACK[key])
  }
  return out
}

export function readClayPalette(el?: Element): ClayPalette {
  if (typeof document === 'undefined') return { ...CLAY_FALLBACK }
  const style = getComputedStyle(el ?? document.documentElement)
  return resolveClayPalette((token) => style.getPropertyValue(token))
}
