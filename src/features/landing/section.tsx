import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps extends ComponentProps<'section'> {
  /** Id of the heading inside the section; wires aria-labelledby. */
  labelledBy: string
  /** Skip the inner container (full-bleed children such as the feature rail). */
  bleed?: boolean
}

/** Landing section: vertical rhythm, anchor offset under the floating nav, 1240px container. */
export function Section({ labelledBy, bleed = false, className, children, ...props }: SectionProps) {
  return (
    <section aria-labelledby={labelledBy} className={cn('scroll-mt-24 py-14 md:py-20', className)} {...props}>
      {bleed ? children : <div className="mx-auto max-w-[var(--mq-container)] px-4 sm:px-6">{children}</div>}
    </section>
  )
}
