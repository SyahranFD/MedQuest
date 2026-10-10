import { useEffect, useRef, useState, type RefObject } from 'react'

interface InViewOptions {
  /** Stop observing after the first time the element enters. Default true. */
  once?: boolean
  /** IntersectionObserver rootMargin. */
  margin?: string
  /** Fraction visible before it counts, 0 to 1. */
  amount?: number
}

/** `const [ref, inView] = useInView<HTMLDivElement>({ once: true })`. */
export function useInView<T extends Element = HTMLDivElement>({
  once = true,
  margin = '0px',
  amount = 0.1,
}: InViewOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setInView(true)
          if (once) io.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin: margin, threshold: amount },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, margin, amount])

  return [ref, inView]
}
