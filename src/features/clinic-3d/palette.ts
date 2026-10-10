import { Color } from 'three'

// Single palette for the 3D clinic. Scene colors are derived at runtime from the design tokens
// (--mq-* CSS variables on :root), so a token change recolors the scene.
//
// Hex literals in THIS FILE ONLY are allowed, and only as the fallback when a variable cannot be
// read (SSR, tests under jsdom, a browser that rejects the value). They mirror src/index.css.
// SKIN_TONES and HAIR_COLORS are human skin and hair tones from the character spec: no design
// token represents them, so they live here as documented constants.

const FALLBACK = {
  '--mq-ground': '#f8faf8',
  '--mq-surface': '#fdfefd',
  '--mq-panel': '#f1f5f2',
  '--mq-inset': '#e8eeea',
  '--mq-ink-1': '#14231c',
  '--mq-ink-2': '#455a50',
  '--mq-ink-3': '#6f8178',
  '--mq-primary': '#2a8266',
  '--mq-primary-hover': '#236f57',
  '--mq-primary-quiet': '#e3f0ea',
  '--mq-danger': '#c23b3b',
  '--mq-danger-ink': '#fbf5f5',
  '--mq-warning-ink': '#2b2208',
  '--mq-warning': '#e0a526',
  '--mq-clay-green': '#3f9d7d',
  '--mq-clay-cream': '#f3ede1',
  '--mq-clay-sky': '#7fb0d8',
  '--mq-clay-coral': '#e58c7f',
  '--mq-clay-butter': '#f0cf7a',
} as const

type TokenName = keyof typeof FALLBACK

/** Skin tones, light to deep (character spec A2). */
const SKIN_TONES = ['#f5d0b0', '#e8b88f', '#cf9468', '#a8714a', '#7a4e32', '#5a3a26'] as const
/** Natural hair colors: black, dark brown, brown, chestnut, deep umber. */
const HAIR_COLORS = ['#1f1a17', '#2f241d', '#47332a', '#5b4033', '#2a2022'] as const
const HAIR_GRAY = '#b9bcb8'
/** Eye, brow and mouth ink (character spec A2 dark brown). */
const FACE_INK = '#2b2118'

function token(name: TokenName): Color {
  let raw = ''
  if (typeof document !== 'undefined') {
    raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }
  const color = new Color(FALLBACK[name])
  if (/^(#|rgb|hsl)/i.test(raw)) color.set(raw)
  return color
}

function mix(a: Color, b: Color, t: number): Color {
  return a.clone().lerp(b, t)
}

function scale(c: Color, f: number): Color {
  return c.clone().multiplyScalar(f)
}

export interface ScenePalette {
  wall: Color
  wallShade: Color
  floor: Color
  floorBorder: Color
  rug: Color
  wood: Color
  woodDark: Color
  sage: Color
  sageDeep: Color
  sageSoft: Color
  fabric: Color
  linen: Color
  coat: Color
  metal: Color
  ink: Color
  screen: Color
  screenLine: Color
  sky: Color
  skyLight: Color
  plant: Color
  plantDark: Color
  posterSoft: Color
  bookA: Color
  bookB: Color
  bookC: Color
  /** Hover and selection cue color. */
  cue: Color
  cueActive: Color
  skin: Color[]
  hair: Color[]
  hairGray: Color
  faceInk: Color
  mouthInner: Color
  blush: Color
  alert: Color
  danger: Color
  dangerInk: Color
  warning: Color
  warningInk: Color
  sickSkin: Color
  clothes: Color[]
  pants: Color
  shoes: Color
  background: Color
  contactShadow: Color
  hemiSky: Color
  hemiGround: Color
  keyLight: Color
}

let cached: ScenePalette | null = null

export function buildPalette(): ScenePalette {
  const cream = token('--mq-clay-cream')
  const surface = token('--mq-surface')
  const green = token('--mq-clay-green')
  const butter = token('--mq-clay-butter')
  const coral = token('--mq-clay-coral')
  const sky = token('--mq-clay-sky')
  const ink1 = token('--mq-ink-1')
  const ink3 = token('--mq-ink-3')
  const panel = token('--mq-panel')
  const primary = token('--mq-primary')
  const primaryHover = token('--mq-primary-hover')
  const danger = token('--mq-danger')

  const wall = mix(mix(cream, butter, 0.1), surface, 0.35)
  const wood = scale(mix(mix(cream, butter, 0.62), coral, 0.2), 0.8)
  const sage = mix(mix(green, ink1, 0.12), surface, 0.18)
  const skinColors = SKIN_TONES.map((hex) => new Color(hex))
  const faceInk = new Color(FACE_INK)
  const coat = mix(surface, cream, 0.35)

  return {
    wall,
    wallShade: scale(mix(wall, wood, 0.2), 0.94),
    floor: mix(wood, cream, 0.22),
    floorBorder: mix(sage, cream, 0.2),
    rug: mix(sage, cream, 0.28),
    wood,
    woodDark: scale(wood, 0.78),
    sage,
    sageDeep: mix(sage, ink1, 0.38),
    sageSoft: mix(sage, surface, 0.5),
    fabric: mix(sage, ink3, 0.18),
    linen: mix(surface, cream, 0.3),
    coat,
    metal: mix(panel, ink3, 0.28),
    ink: mix(ink1, ink3, 0.25),
    screen: mix(sage, ink1, 0.62),
    screenLine: mix(sage, surface, 0.55),
    sky: mix(sky, surface, 0.4),
    skyLight: mix(sky, surface, 0.78),
    plant: mix(mix(green, ink3, 0.55), cream, 0.12),
    plantDark: mix(mix(green, ink1, 0.5), ink3, 0.3),
    posterSoft: mix(coral, cream, 0.55),
    bookA: mix(sage, ink3, 0.2),
    bookB: mix(sky, ink3, 0.45),
    bookC: mix(coral, cream, 0.35),
    cue: primary,
    cueActive: primaryHover,
    skin: skinColors,
    hair: HAIR_COLORS.map((hex) => new Color(hex)),
    hairGray: new Color(HAIR_GRAY),
    faceInk,
    mouthInner: mix(faceInk, coral, 0.28),
    blush: mix(skinColors[1], coral, 0.55),
    alert: mix(danger, cream, 0.2),
    danger,
    dangerInk: token('--mq-danger-ink'),
    warning: token('--mq-warning'),
    warningInk: token('--mq-warning-ink'),
    sickSkin: new Color('#b8c7a0'),
    clothes: [
      mix(sky, ink3, 0.35),
      mix(butter, cream, 0.45),
      mix(coral, cream, 0.45),
      mix(green, surface, 0.4),
      mix(cream, ink3, 0.3),
      mix(sky, surface, 0.45),
    ],
    pants: mix(ink3, cream, 0.18),
    shoes: mix(ink1, ink3, 0.2),
    background: mix(mix(cream, wood, 0.25), ink3, 0.1),
    contactShadow: mix(ink1, green, 0.4),
    hemiSky: mix(surface, sky, 0.3),
    hemiGround: mix(wood, sage, 0.35),
    keyLight: mix(surface, butter, 0.4),
  }
}

/** Cached palette. Call `resetPalette` after a theme change. */
export function getPalette(): ScenePalette {
  cached ??= buildPalette()
  return cached
}

export function resetPalette() {
  cached = null
}
