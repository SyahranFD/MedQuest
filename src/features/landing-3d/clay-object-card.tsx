import { cn } from '@/lib/utils'
import type { ClayCompositionProps } from './clay-hero'
import { ClayFallback } from './clay-fallback'
import { ClayItem, ClayRig } from './clay-scene'
import { ClayStage } from './clay-stage'
import type { ClayObjectName } from './objects/builders'

export type ClayTint = 'green' | 'blue' | 'coral' | 'amber' | 'teal'

export interface ClayObjectCardProps extends ClayCompositionProps {
  object: ClayObjectName
  /** Quiet tint field behind the object (CLAUDE.md 8.3 E1). */
  tint?: ClayTint
  color?: string
}

/** Object display scale and rest height so each silhouette fills the square comfortably. */
const CARD_POSE: Record<ClayObjectName, { scale: number; y: number }> = {
  pill: { scale: 1.45, y: 0.95 },
  cross: { scale: 1.1, y: 0.9 },
  heart: { scale: 1.45, y: 1.0 },
  stethoscope: { scale: 1.3, y: 1.0 },
  syringe: { scale: 1.1, y: 1.1 },
  thermometer: { scale: 1.45, y: 1.0 },
  clipboard: { scale: 1.3, y: 1.0 },
  firstAid: { scale: 1.45, y: 0.95 },
  plaster: { scale: 1.6, y: 0.85 },
  potion: { scale: 1.35, y: 1.0 },
  briefcase: { scale: 1.3, y: 1.05 },
}

/** One clay object on a quiet tinted square, for feature cards. Keep a page to a handful of these. */
export function ClayObjectCard({ object, tint = 'green', color, className, reducedMotion, onStats }: ClayObjectCardProps) {
  const pose = CARD_POSE[object]
  return (
    <div
      className={cn('aspect-square overflow-hidden rounded-[var(--mq-radius-lg)]', className)}
      style={{ backgroundColor: `var(--mq-tint-${tint})` }}
    >
      <ClayStage
        reducedMotion={reducedMotion}
        onStats={onStats}
        camera={{ position: [0, 2.6, 8], fov: 30, target: [0, 0.9, 0] }}
        fallback={<ClayFallback variant="card" object={object} className="size-full" />}
      >
        <ClayRig shadowScale={6} />
        <ClayItem name={object} color={color} position={[0, pose.y, 0]} scale={pose.scale} seed={object.length + 7} />
      </ClayStage>
    </div>
  )
}
