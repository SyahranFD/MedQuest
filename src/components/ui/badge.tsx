import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Solid bright fills with dark ink (CLAUDE.md 8.3 E8): no tonal chips, never the primary colour.
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap h-6 rounded-full px-2.5 text-chip font-medium [&_svg]:size-3',
  {
    variants: {
      variant: {
        danger: 'bg-chip-danger text-chip-danger-ink',
        warning: 'bg-chip-warning text-chip-warning-ink',
        success: 'bg-chip-success text-chip-success-ink',
        info: 'bg-chip-info text-chip-info-ink',
        neutral: 'bg-chip-neutral text-chip-neutral-ink',
        category: '',
      },
      category: {
        infection: '',
        cardio: '',
        endocrine: '',
        pulmo: '',
        neuro: '',
      },
    },
    compoundVariants: [
      { variant: 'category', category: 'infection', className: 'bg-chip-infection text-ink-1' },
      { variant: 'category', category: 'cardio', className: 'bg-chip-cardio text-ink-1' },
      { variant: 'category', category: 'endocrine', className: 'bg-chip-endocrine text-ink-1' },
      { variant: 'category', category: 'pulmo', className: 'bg-chip-pulmo text-ink-1' },
      { variant: 'category', category: 'neuro', className: 'bg-chip-neuro text-ink-1' },
    ],
    defaultVariants: { variant: 'neutral' },
  },
)

export type BadgeCategory = NonNullable<VariantProps<typeof badgeVariants>['category']>
export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, category, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, category: variant === 'category' ? category : null }), className)}
      {...props}
    />
  )
}
