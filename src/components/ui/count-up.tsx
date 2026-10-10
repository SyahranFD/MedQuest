import { animate } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ease, useInView, useReducedMotion } from '@/lib/motion'
import { useLocale, type Locale } from '@/lib/i18n'

interface CountUpProps {
  to: number
  from?: number
  /** Seconds. Default 1.2 (expo-out). */
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

function formatNumber(n: number, locale: Locale, decimals: number, prefix: string, suffix: string) {
  const nf = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${prefix}${nf.format(n)}${suffix}`
}

/** Counts from `from` to `to` once on entering the viewport. Shows the final value under reduced motion. */
export function CountUp({
  to,
  from = 0,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const reduced = useReducedMotion()
  const [locale] = useLocale()
  const [ref, inView] = useInView<HTMLSpanElement>({ margin: '0px 0px -10% 0px' })
  const textRef = useRef<HTMLSpanElement>(null)
  const format = (n: number) => formatNumber(n, locale, decimals, prefix, suffix)

  useEffect(() => {
    const el = textRef.current
    if (!el || reduced || !inView) return
    const controls = animate(from, to, {
      duration,
      ease: ease.reveal,
      onUpdate: (n) => {
        el.textContent = formatNumber(n, locale, decimals, prefix, suffix)
      },
    })
    return () => controls.stop()
  }, [inView, reduced, from, to, duration, locale, decimals, prefix, suffix])

  return (
    <span ref={ref} data-slot="count-up" className={className}>
      <span className="sr-only">{format(to)}</span>
      <span ref={textRef} aria-hidden="true">
        {format(reduced ? to : from)}
      </span>
    </span>
  )
}
