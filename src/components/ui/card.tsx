import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Hairline border and a tonal shift, never a shadow. `tint` fills are for illustration cards (E1).
const cardVariants = cva('flex flex-col gap-4 rounded-md border p-5 text-ink-1', {
  variants: {
    tone: {
      surface: 'border-line bg-surface',
      panel: 'border-transparent bg-panel',
      green: 'border-transparent bg-tint-green',
      blue: 'border-transparent bg-tint-blue',
      coral: 'border-transparent bg-tint-coral',
      amber: 'border-transparent bg-tint-amber',
      teal: 'border-transparent bg-tint-teal',
    },
  },
  defaultVariants: { tone: 'surface' },
})

export type CardProps = ComponentProps<'div'> & VariantProps<typeof cardVariants>

export function Card({ className, tone, ...props }: CardProps) {
  return <div data-slot="card" className={cn(cardVariants({ tone }), className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-heading-card font-semibold text-ink-1', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p data-slot="card-description" className={cn('text-body-s text-ink-2', className)} {...props} />
  )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('flex flex-col gap-3', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="card-footer" className={cn('mt-auto flex items-center gap-2', className)} {...props} />
  )
}
