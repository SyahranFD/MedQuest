import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

/** Full wordmark (transparent copy of logo-full.webp; the original has an opaque black ground) (560x148, a 2x-3x downscale of the 1400x370 original). Size it with height, e.g. `className="h-8"`. */
export function Logo({ className, ...props }: Omit<ComponentProps<'img'>, 'src' | 'alt'>) {
  const t = useT()
  return (
    <img
      src="/brand/logo-full-clear-560.webp"
      alt={t('brand.name')}
      width={560}
      height={148}
      decoding="async"
      className={cn('h-8 w-auto select-none', className)}
      {...props}
    />
  )
}

/** Square mark. Decorative by default: pair it with visible text. */
export function LogoMark({ className, ...props }: Omit<ComponentProps<'img'>, 'src' | 'alt'>) {
  return (
    <img
      src="/brand/logo-mark-clear-128.webp"
      alt=""
      width={128}
      height={128}
      decoding="async"
      className={cn('size-8 select-none', className)}
      {...props}
    />
  )
}
