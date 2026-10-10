import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Page content column (`<main id="main">`): 64rem, or 76rem with `wide`. */
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
        'mx-auto w-full px-4 py-8 sm:px-6 sm:py-10',
        wide ? 'max-w-[76rem]' : 'max-w-[64rem]',
        className,
      )}
      {...props}
    />
  )
}
