import { ClayFallback } from './clay-fallback'
import type { ClayCompositionProps } from './clay-hero'
import { ClayFit, ClayItem, ClayRig } from './clay-scene'
import { ClayStage } from './clay-stage'
import { CLAY_OBJECT_NAMES } from './objects/names'

const COLS = 4
const GAP_X = 3.4
const GAP_Y = 3.1

function GalleryScene() {
  const rows = Math.ceil(CLAY_OBJECT_NAMES.length / COLS)
  return (
    <>
      <ClayRig shadows={false} />
      <ClayFit width={COLS * GAP_X}>
        {CLAY_OBJECT_NAMES.map((name, i) => {
          const x = ((i % COLS) - (COLS - 1) / 2) * GAP_X
          const y = ((rows - 1) / 2 - Math.floor(i / COLS)) * GAP_Y
          return <ClayItem key={name} name={name} position={[x, y, 0]} scale={name === 'briefcase' ? 1.1 : 1.2} seed={i + 3} />
        })}
      </ClayFit>
    </>
  )
}

/** Lab-only: every object in one canvas, in `CLAY_OBJECT_NAMES` order, 4 per row. */
export function ClayGallery({ className, reducedMotion, onStats }: ClayCompositionProps) {
  return (
    <ClayStage
      className={className}
      reducedMotion={reducedMotion}
      onStats={onStats}
      camera={{ position: [0, 0, 20], fov: 30, target: [0, 0, 0] }}
      fallback={<ClayFallback variant="hero" className="size-full" />}
    >
      <GalleryScene />
    </ClayStage>
  )
}
