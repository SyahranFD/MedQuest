import * as SwitchPrimitive from '@radix-ui/react-switch'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // 44px hit area via the padded wrapper on touch; the visible track stays 24px high
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-line-strong p-0.5 transition-colors duration-100 ease-out',
        'before:absolute before:-inset-2.5 before:content-[""] data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5 rounded-full bg-surface transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=checked]:translate-x-5 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  )
}
