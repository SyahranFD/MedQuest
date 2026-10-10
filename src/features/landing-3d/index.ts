import { createElement, lazy, Suspense } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ClayFallback } from './clay-fallback'
import type { ClayCompositionProps } from './clay-hero'
import type { ClayClusterProps } from './clay-cluster'
import type { ClayObjectCardProps } from './clay-object-card'

export type { ClayCompositionProps } from './clay-hero'
export type { ClayClusterProps, ClayClusterVariant } from './clay-cluster'
export type { ClayObjectCardProps, ClayTint } from './clay-object-card'
export type { ClayObjectProps } from './clay-object'
export type { ClayObjectName } from './objects/names'
export type { ClayStats } from './clay-scene'
export { CLAY_OBJECT_NAMES } from './objects/names'
export { ClayFallback } from './clay-fallback'
export type { ClayFallbackVariant } from './clay-fallback'

/**
 * Lazy-load a composition. The three.js chunk is fetched on first mount; until then (and if WebGL
 * is missing or the chunk fails) the token-colored static composition is shown in its place.
 */
function lazyClay<P extends { className?: string }>(
  load: () => Promise<{ default: ComponentType<P> }>,
  fallbackFor: (props: P) => ReactNode,
): ComponentType<P> {
  const Lazy = lazy(load)
  const Wrapped = (props: P) =>
    createElement(
      Suspense,
      { fallback: createElement('div', { className: cn('relative size-full', props.className), 'aria-hidden': true }, fallbackFor(props)) },
      createElement(Lazy, props as never),
    )
  return Wrapped
}

const fb = (variant: 'hero' | 'rail' | 'cta' | 'card', object?: ClayObjectCardProps['object']) =>
  createElement(ClayFallback, { variant, object, className: 'size-full' })

export const ClayHero: ComponentType<ClayCompositionProps> = lazyClay(
  () => import('./clay-hero').then((m) => ({ default: m.ClayHero })),
  () => fb('hero'),
)

export const ClayCluster: ComponentType<ClayClusterProps> = lazyClay(
  () => import('./clay-cluster').then((m) => ({ default: m.ClayCluster })),
  (p) => fb(p.variant),
)

export const ClayObjectCard: ComponentType<ClayObjectCardProps> = lazyClay(
  () => import('./clay-object-card').then((m) => ({ default: m.ClayObjectCard })),
  (p) => fb('card', p.object),
)

export const ClayGallery: ComponentType<ClayCompositionProps> = lazyClay(
  () => import('./clay-gallery').then((m) => ({ default: m.ClayGallery })),
  () => fb('hero'),
)
