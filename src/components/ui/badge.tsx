import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Solid fills only (CLAUDE.md 8.1): no tonal chips, never the primary colour.
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-label font-semibold [&_svg]:size-3',
  {
    variants: {
      variant: {
        danger: 'bg-danger text-danger-ink',
        warning: 'bg-warning text-warning-ink',
        success: 'bg-success text-success-ink',
        neutral: 'bg-neutral text-neutral-ink',
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
      { variant: 'category', category: 'infection', className: 'bg-cat-infection-fill text-primary-ink' },
      { variant: 'category', category: 'cardio', className: 'bg-cat-cardio-fill text-primary-ink' },
      { variant: 'category', category: 'endocrine', className: 'bg-cat-endocrine-fill text-ink-1' },
      { variant: 'category', category: 'pulmo', className: 'bg-cat-pulmo-fill text-primary-ink' },
      { variant: 'category', category: 'neuro', className: 'bg-cat-neuro-fill text-primary-ink' },
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
