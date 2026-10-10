import type { Transition } from 'motion/react'

export { useReducedMotion } from './use-reduced-motion'
export { useInView } from './use-in-view'
export { usePauseOffscreen } from './use-pause-offscreen'

type Bezier = [number, number, number, number]

/** Mirrors --mq-ease-* in index.css, plus the long reveal curve used for scroll entrances. */
export const ease = {
  out: [0.22, 1, 0.36, 1] as Bezier,
  inOut: [0.65, 0, 0.35, 1] as Bezier,
  reveal: [0.16, 1, 0.3, 1] as Bezier,
} as const

/**
 * Springs follow Apple rule 4. `default` is critically damped (response .35, bounce 0): use it for
 * anything the user touches that did not carry momentum. `momentum` adds a little bounce and is
 * only for flicks and releases. `sheet` is Apple's drawer value (damping .8, response .3).
 */
export const spring = {
  default: { type: 'spring', duration: 0.35, bounce: 0 },
  momentum: { type: 'spring', duration: 0.4, bounce: 0.2 },
  sheet: { type: 'spring', duration: 0.3, bounce: 0.2 },
} as const satisfies Record<string, Transition>

/** Reduced-motion replacement for every slide or spring: a short opacity cross-fade. */
export const crossFade = { duration: 0.2, ease: 'linear' } as const satisfies Transition

export const reveal = {
  /** Default fade-up distance in px (24 to 40 per the brief). */
  distance: 32,
  duration: 0.75,
  stagger: 0.09,
  /** Viewport margin so entrances start a little after the element touches the edge. */
  margin: '0px 0px -12% 0px',
} as const
