import { QUALITY_PROFILES } from './budget'
import { useClay } from './clay-context'
import { ClayFallback } from './clay-fallback'
import { ClayFit, ClayItem, ClayParallax, ClayRig, type ClayItemProps, type ClayStats } from './clay-scene'
import { ClayStage } from './clay-stage'

export interface ClayCompositionProps {
  className?: string
  /** Overrides the OS / UI-store reduced-motion preference (the lab toggle). */
  reducedMotion?: boolean
  onStats?: (stats: ClayStats) => void
}

/** Satellites in priority order: the first N survive on low quality. */
const SATELLITES: Omit<ClayItemProps, 'seed'>[] = [
  { name: 'heart', position: [2.7, 0.85, 1.2], scale: 0.95 },
  { name: 'pill', position: [-2.7, 0.75, 1.1], scale: 1.05 },
  { name: 'clipboard', position: [2.4, 2.25, -0.6], scale: 1.0 },
  { name: 'stethoscope', position: [-2.4, 2.2, -0.7], scale: 1.1 },
  { name: 'potion', position: [1.15, 0.7, 2.6], scale: 0.8 },
  { name: 'syringe', position: [-1.15, 0.95, 2.7], scale: 0.7 },
  { name: 'firstAid', position: [-0.2, 3.1, -2.2], scale: 0.85 },
  { name: 'plaster', position: [3.0, 0.45, -1.4], scale: 0.75 },
]

function HeroScene() {
  const { quality } = useClay()
  const count = QUALITY_PROFILES[quality].heroSatellites
  return (
    <>
      <ClayRig groundRadius={3.5} shadowScale={9} />
      <ClayParallax>
        <ClayFit width={7.8}>
          <ClayItem name="briefcase" position={[0, 1.45, 0]} scale={1.55} seed={1} />
          {SATELLITES.slice(0, count).map((s, i) => (
            <ClayItem key={s.name} {...s} seed={i + 2} />
          ))}
        </ClayFit>
      </ClayParallax>
    </>
  )
}

/** Central briefcase on a tinted pedestal with 4 to 5 satellites and cursor parallax. */
export function ClayHero({ className, reducedMotion, onStats }: ClayCompositionProps) {
  return (
    <ClayStage
      className={className}
      reducedMotion={reducedMotion}
      onStats={onStats}
      camera={{ position: [0, 4.4, 12.6], fov: 28, target: [0, 1.25, 0] }}
      fallback={<ClayFallback variant="hero" className="size-full" />}
    >
      <HeroScene />
    </ClayStage>
  )
}
