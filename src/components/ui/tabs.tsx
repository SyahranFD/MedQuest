import * as TabsPrimitive from '@radix-ui/react-tabs'
import { createContext, useContext, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** `segmented`: hairline pill group (a toggle). `underline`: text tabs on a full-width hairline (page sections). */
export type TabsVariant = 'segmented' | 'underline'

const VariantContext = createContext<TabsVariant>('segmented')

export function Tabs({
  className,
  variant = 'segmented',
  ...props
}: ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
  return (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-variant={variant}
        className={cn('flex min-w-0 max-w-full flex-col gap-4', className)}
        {...props}
      />
    </VariantContext.Provider>
  )
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const variant = useContext(VariantContext)
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        variant === 'underline'
          ? 'flex w-full items-end gap-5 border-b border-line max-sm:overflow-x-auto max-sm:[scrollbar-width:none]'
          : 'inline-flex h-9 w-fit max-w-full overflow-x-auto [scrollbar-width:none] pointer-coarse:h-auto items-center gap-0.5 rounded-sm border border-line p-0.5',
        className,
      )}
      {...props}
    />
  )
}

/** `controlled`: the tab owns a `TabsContent`. Without it the tab is a filter and must not point at a missing panel. */
export function TabsTrigger({ className, controlled = false, ...props }: ComponentProps<typeof TabsPrimitive.Trigger> & { controlled?: boolean }) {
  const variant = useContext(VariantContext)
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      {...(controlled ? {} : { 'aria-controls': undefined })}
      className={cn(
        'inline-flex items-center justify-center gap-2 text-body-s font-medium whitespace-nowrap text-ink-3 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        'transition-[background-color,color,border-color] duration-100 ease-out hover:text-ink-1',
        'disabled:pointer-events-none disabled:text-ink-4',
        variant === 'underline'
          ? '-mb-px max-sm:mb-0 h-10 border-b-2 border-transparent focus-visible:rounded-row focus-visible:outline-offset-[-3px] data-[state=active]:border-ink-1 data-[state=active]:text-ink-1'
          : 'h-full rounded-row px-3 data-[state=active]:bg-hover data-[state=active]:text-ink-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={cn('outline-offset-4', className)} {...props} />
  )
}
