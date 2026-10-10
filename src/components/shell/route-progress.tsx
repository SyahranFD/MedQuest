import { useRouterState } from '@tanstack/react-router'
import { animate } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ease, useReducedMotion } from '@/lib/motion'

/** Thin bar at the top edge while a route is loading. Transform and opacity only. */
export function RouteProgress() {
  const pending = useRouterState({ select: (s) => s.isLoading })
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (pending) {
      wasPending.current = true
      el.style.transform = 'scaleX(0)'
      el.style.opacity = '1'
      animate(el, { transform: 'scaleX(0.85)' }, { duration: reduced ? 0 : 4, ease: ease.out })
    } else if (wasPending.current) {
      wasPending.current = false
      animate(el, { transform: 'scaleX(1)' }, { duration: reduced ? 0 : 0.2 })
        .then(() => animate(el, { opacity: 0 }, { duration: 0.25 }))
        .catch(() => {})
    }
  }, [pending, reduced])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="route-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary opacity-0"
      style={{ transform: 'scaleX(0)' }}
    />
  )
}
