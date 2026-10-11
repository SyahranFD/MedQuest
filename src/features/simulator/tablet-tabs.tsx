import * as TabsPrimitive from '@radix-ui/react-tabs'
import { LayoutGroup, motion } from 'motion/react'
import { crossFade, spring, useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { PANEL_TABS, type PanelTab } from './encounter-panel'
import { useST } from './use-st'

interface TabletTabsProps {
  value: PanelTab
  unseenResults: number
  className?: string
}

/**
 * iPadOS-style segmented control for the tablet: one raised thumb slides between the segments on a
 * critically damped spring (shared layout, so a mid-flight press re-targets from the live position).
 * Radix supplies the tablist semantics, roving focus and Arrow, Home and End keys. Under reduced
 * motion the thumb cross-fades in place instead of travelling. Labels collapse to icons on phones.
 * Must render inside a Radix `Tabs` root.
 */
export function TabletTabs({ value, unseenResults, className }: TabletTabsProps) {
  const st = useST()
  const reduced = useReducedMotion()
  return (
    <LayoutGroup id="tablet-tabs">
      <TabsPrimitive.List aria-label={st('tab.label')} className={cn('flex items-center gap-0.5 rounded-lg bg-inset p-1', className)}>
        {PANEL_TABS.map(({ id, icon: Icon }, i) => (
          <TabsPrimitive.Trigger
            key={id}
            value={id}
            aria-keyshortcuts={String(i + 1)}
            className="group relative grid h-11 min-w-11 place-items-center rounded-md px-3 text-body-s font-medium whitespace-nowrap text-ink-3 outline-none transition-colors duration-100 ease-out hover:text-ink-1 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary data-[state=active]:text-ink-1 sm:px-3.5 md:h-9"
          >
            {value === id && (
              <motion.span
                aria-hidden="true"
                data-testid="tablet-thumb"
                className="absolute inset-0 rounded-md border border-line bg-surface"
                {...(reduced
                  ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: crossFade }
                  : { layoutId: 'tablet-thumb', transition: spring.default })}
              />
            )}
            <span className="relative flex items-center gap-2 transition-transform duration-100 ease-out group-active:scale-[.97]">
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              <span className="max-sm:sr-only">{st(`tab.${id}`)}</span>
              {id === 'orders' && unseenResults > 0 && (
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-ink">{unseenResults}</span>
              )}
            </span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </LayoutGroup>
  )
}
