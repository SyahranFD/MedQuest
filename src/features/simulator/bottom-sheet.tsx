import { animate, motion, useDragControls, useMotionValue, type PanInfo } from 'motion/react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useReducedMotion } from '@/lib/motion'

export type SheetSnap = 'peek' | 'half' | 'full'

const MIN_QUERY = '(min-width: 1024px)'
const subscribeMedia = (cb: () => void) => {
  const mq = window.matchMedia(MIN_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** True from the lg breakpoint up, where the encounter panel sits beside the stage. */
export function useIsDesktop() {
  return useSyncExternalStore(
    subscribeMedia,
    () => window.matchMedia(MIN_QUERY).matches,
    () => false,
  )
}

export function useViewportHeight() {
  const [h, setH] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight))
  useEffect(() => {
    const on = () => setH(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return h
}

export const PEEK_PX = 128
const FULL_RATIO = 0.9
const HALF_RATIO = 0.56
/** Apple's momentum projection for a release velocity in px/s. */
const project = (v: number, rate = 0.99) => ((v / 1000) * rate) / (1 - rate)

export function snapOffsets(viewport: number, peekPx = PEEK_PX) {
  const height = viewport * FULL_RATIO
  return {
    height,
    peek: height - peekPx,
    half: height - viewport * HALF_RATIO,
    full: 0,
  } satisfies Record<SheetSnap | 'height', number>
}

/** Height of the sheet that is on screen in a snap state: the stage resizes to what is left above it. */
export function sheetVisiblePx(snap: SheetSnap, viewport: number, peekPx = PEEK_PX) {
  const o = snapOffsets(viewport, peekPx)
  return o.height - o[snap]
}

interface BottomSheetProps {
  snap: SheetSnap
  /** Visible height at the peek snap: handle, optional bed strip and the tab list. */
  peekPx?: number
  onSnap: (snap: SheetSnap) => void
  /** Always visible part: grab handle plus the tab list. */
  header: ReactNode
  children: ReactNode
}

/**
 * Mobile panel. The handle area follows the pointer 1:1, a release projects the resting point from
 * its velocity and springs there (bounce only when the release carried momentum).
 */
export function BottomSheet({ snap, peekPx = PEEK_PX, onSnap, header, children }: BottomSheetProps) {
  const vh = useViewportHeight()
  const reduced = useReducedMotion()
  const offsets = useMemo(() => snapOffsets(vh, peekPx), [vh, peekPx])
  const y = useMotionValue(offsets[snap])
  const controls = useDragControls()
  /** Finger velocity of the last release (px/s), handed to the spring that settles on a new snap. */
  const handoff = useRef(0)

  useEffect(() => {
    const target = offsets[snap]
    const velocity = handoff.current
    handoff.current = 0
    const anim = reduced
      ? animate(y, target, { duration: 0.15, ease: 'linear' })
      : animate(y, target, { type: 'spring', duration: 0.35, bounce: Math.abs(velocity) > 400 ? 0.2 : 0, velocity })
    return () => anim.stop()
  }, [snap, offsets, reduced, y])

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    const projected = y.get() + project(info.velocity.y)
    const options = (['peek', 'half', 'full'] as const).map((s) => ({ s, d: Math.abs(offsets[s] - projected) }))
    const next = options.sort((a, b) => a.d - b.d)[0]!.s
    const flick = Math.abs(info.velocity.y) > 400
    if (next !== snap) handoff.current = info.velocity.y
    onSnap(next)
    if (next === snap) {
      animate(y, offsets[next], reduced ? { duration: 0.15 } : { type: 'spring', duration: 0.35, bounce: flick ? 0.2 : 0, velocity: info.velocity.y })
    }
  }

  return (
    <motion.div
      data-slot="bottom-sheet"
      style={{ y, height: offsets.height }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: offsets.peek }}
      dragElastic={0.12}
      dragMomentum={false}
      onDragEnd={onDragEnd}
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-lg border border-b-0 border-line bg-surface lg:hidden"
    >
      <div onPointerDown={(e) => controls.start(e)} className="touch-none select-none">
        <div className="flex justify-center pt-2 pb-1" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        {header}
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3"
        style={{ paddingBottom: `calc(${snap === 'full' ? 0 : offsets[snap]}px + env(safe-area-inset-bottom) + 1.5rem)` }}
      >
        {children}
      </div>
    </motion.div>
  )
}
