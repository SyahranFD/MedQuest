import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Press feedback only (Apple rule 1): scale on :active, colour on hover. Never lift or shadow.
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold select-none',
    'transition-[transform,background-color,color,border-color] duration-100 ease-out',
    'active:scale-[.985] motion-reduce:active:scale-100',
    'disabled:pointer-events-none disabled:bg-panel disabled:text-ink-4 disabled:border-transparent',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-ink hover:bg-primary-hover active:bg-primary-press',
        secondary:
          'border border-line-strong bg-transparent text-ink-1 hover:bg-panel active:bg-inset',
        ghost: 'bg-transparent text-ink-1 hover:bg-panel active:bg-inset',
        danger: 'bg-danger text-danger-ink hover:brightness-95 active:brightness-90',
        warning: 'bg-warning text-warning-ink hover:brightness-95 active:brightness-90',
        link: 'h-auto min-h-0 rounded-xs px-0 text-primary-hover underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-9 rounded-sm px-3 text-body-s pointer-coarse:min-h-11',
        default: 'h-11 rounded-sm px-4 text-body-s',
        lg: 'h-12 rounded-full px-7 text-body',
        icon: 'size-11 rounded-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
