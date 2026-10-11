import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** A span so it stays valid inside a paragraph (page descriptions); `block` gives it a box. */
export function Skeleton({ className, ...props }: ComponentProps<'span'>) {
  return <span data-slot="skeleton" aria-hidden="true" className={cn('mq-skeleton block max-w-full', className)} {...props} />
}
