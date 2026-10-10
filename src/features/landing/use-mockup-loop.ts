import { useCallback, useEffect, useState, type RefObject } from 'react'
import { usePauseOffscreen, useReducedMotion } from '@/lib/motion'
import { MOCKUP_DWELL_MS, nextState, type MockupState } from './mockup-machine'

/**
 * Drives the mockup. Advances only while the region is on screen, the tab is visible, motion is
 * allowed, and the pointer or focus is not inside it. Choosing a step restarts the dwell timer.
 */
export function useMockupLoop(regionRef: RefObject<Element | null>) {
  const visible = usePauseOffscreen(regionRef)
  const reduced = useReducedMotion()
  const [state, setState] = useState<MockupState>('brief')
  const [held, setHeld] = useState(false)
  const playing = visible && !reduced && !held

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setState(nextState), MOCKUP_DWELL_MS)
    return () => clearTimeout(timer)
  }, [playing, state])

  const hold = useCallback((value: boolean) => setHeld(value), [])
  return { state, select: setState, playing, hold }
}
