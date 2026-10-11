import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Page content column (`<main id="main">`): 720px reading width, or 1120px list width with `wide`. */
export function PageBody({
  wide = false,
  className,
  ...props
}: ComponentProps<'main'> & { wide?: boolean }) {
  return (
    <main
      id="main"
      data-slot="page-body"
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6',
        wide ? 'max-w-[var(--mq-page-list)]' : 'max-w-[var(--mq-page-read)]',
        className,
      )}
      {...props}
    />
  )
}
