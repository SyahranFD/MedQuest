import { QUALITY_PROFILES } from './budget'
import { useClay } from './clay-context'
import type { ClayCompositionProps } from './clay-hero'
import { ClayFallback } from './clay-fallback'
import { ClayFit, ClayItem, ClayParallax, ClayRig, type ClayItemProps } from './clay-scene'
import { ClayStage } from './clay-stage'

export type ClayClusterVariant = 'rail' | 'cta'

export interface ClayClusterProps extends ClayCompositionProps {
  variant: ClayClusterVariant
}

const LAYOUTS: Record<ClayClusterVariant, { width: number; ground: number; items: Omit<ClayItemProps, 'seed'>[] }> = {
  rail: {
    width: 5.2,
    ground: 0,
    items: [
      { name: 'heart', position: [0, 0.9, 0.4], scale: 0.95 },
      { name: 'clipboard', position: [-2.2, 1.05, -0.2], scale: 0.9 },
      { name: 'pill', position: [2.2, 0.85, 0.2], scale: 0.95 },
    ],
  },
  cta: {
    width: 10,
    ground: 4.4,
    items: [
      { name: 'firstAid', position: [-2.5, 0.95, 0.4], scale: 1.0 },
      { name: 'briefcase', position: [0, 1.3, 0], scale: 1.25 },
      { name: 'thermometer', position: [2.6, 1.05, 0.2], scale: 1.0 },
      { name: 'plaster', position: [-4.4, 0.55, -0.3], scale: 0.85 },
      { name: 'potion', position: [4.5, 0.7, 0.8], scale: 0.8 },
    ],
  },
}

function ClusterScene({ variant }: { variant: ClayClusterVariant }) {
  const { quality } = useClay()
  const layout = LAYOUTS[variant]
  const items = quality === 'low' ? layout.items.slice(0, 3) : layout.items
  return (
    <>
      <ClayRig groundRadius={layout.ground} shadowScale={layout.width * 1.3} />
      <ClayParallax yaw={0.07} pitch={0.03}>
        <ClayFit width={QUALITY_PROFILES[quality].segments < 1 ? 7 : layout.width}>
          {items.map((s, i) => (
            <ClayItem key={s.name} {...s} seed={i + (variant === 'rail' ? 20 : 40)} />
          ))}
        </ClayFit>
      </ClayParallax>
    </>
  )
}

/** Smaller 3 to 5 object groups for the feature rail and the closing call to action. */
export function ClayCluster({ variant, className, reducedMotion, onStats }: ClayClusterProps) {
  return (
    <ClayStage
      className={className}
      reducedMotion={reducedMotion}
      onStats={onStats}
      camera={{ position: [0, 3.2, 12], fov: 26, target: [0, 0.9, 0] }}
      fallback={<ClayFallback variant={variant} className="size-full" />}
    >
      <ClusterScene variant={variant} />
    </ClayStage>
  )
}
