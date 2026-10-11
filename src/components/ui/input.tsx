import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const fieldClass = cn(
  'w-full rounded-sm border border-line-strong bg-raised px-3 text-body text-ink-1 sm:text-body-s placeholder:text-ink-muted',
  'transition-[border-color,background-color] duration-100 ease-out hover:border-ink-4',
  'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary',
  'aria-invalid:border-danger aria-invalid:outline-danger disabled:cursor-not-allowed disabled:bg-panel disabled:text-ink-4',
)

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input data-slot="input" type={type} className={cn(fieldClass, 'h-10 pointer-coarse:h-11', className)} {...props} />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldClass, 'min-h-24 resize-y py-2.5', className)}
      {...props}
    />
  )
}
