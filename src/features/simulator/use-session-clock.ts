import { useEffect, useRef } from 'react'
import { useSessionStore } from '@/features/session/store'
import type { SessionEvent } from '@/features/session/types'

/** Longest real gap one frame may advance (a stalled tab must not skip the whole shift). */
export const MAX_FRAME_DT = 0.25
/** The store is ticked at about 4 Hz: fast enough for a clock, cheap for React. */
export const TICK_STEP = 0.25

/**
 * Drives `tick(dt)` from requestAnimationFrame. Pauses while the tab is hidden and restarts its
 * timeline on return, so time never jumps. `onEvents` receives what the engine fired.
 */
export function useSessionClock(enabled: boolean, onEvents?: (events: SessionEvent[]) => void) {
  const handler = useRef(onEvents)
  useEffect(() => {
    handler.current = onEvents
  })

  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let last: number | null = null
    let acc = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (document.hidden) {
        last = null
        return
      }
      if (last === null) {
        last = now
        return
      }
      acc += Math.min((now - last) / 1000, MAX_FRAME_DT)
      last = now
      if (acc < TICK_STEP) return
      const dt = acc
      acc = 0
      const events = useSessionStore.getState().tick(dt)
      if (events.length) handler.current?.(events)
    }

    const onVisibility = () => {
      last = null
    }
    raf = requestAnimationFrame(frame)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled])
}
