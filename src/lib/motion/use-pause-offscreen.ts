import { useEffect, useState, type RefObject } from 'react'

/**
 * For loops (idle float, looping mockup, rAF scenes): true only while the element is in the
 * viewport and the tab is visible. Gate the loop on it so nothing animates offscreen.
 */
export function usePauseOffscreen(ref: RefObject<Element | null>, margin = '100px'): boolean {
  const [visible, setVisible] = useState(false)
  const [tabVisible, setTabVisible] = useState(
    typeof document === 'undefined' || document.visibilityState === 'visible',
  )

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), {
      rootMargin: margin,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])

  useEffect(() => {
    const onChange = () => setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible && tabVisible
}
