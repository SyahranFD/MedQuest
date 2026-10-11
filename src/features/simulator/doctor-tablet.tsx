import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { crossFade, spring, useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { PanelTab } from './encounter-panel'
import { TabletTabs } from './tablet-tabs'
import { useST } from './use-st'

interface DoctorTabletProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** A click on the 3D scene while open. The scene may be a patient press, so the parent decides whether to close. */
  onSceneClick: () => void
  tab: PanelTab
  onTabChange: (tab: PanelTab) => void
  unseenResults: number
  /** Patient name and age in the toolbar. */
  title: string
  /** Bed placement is showing: no tab control, the children are the placement view. */
  placing: boolean
  /** Phones: the tablet becomes a bottom sheet. */
  sheet: boolean
  children: ReactNode
}

/**
 * The doctor's tablet: a modal dialog over a lightly dimmed, still-live scene. It grows from the dock
 * button with a critically damped spring and shrinks back along the same path. Radix supplies the
 * focus trap, Esc and outside click; the dim layer ignores the pointer so the dock stays pressable (open, switch or
 * reverse a close mid-flight); focus returns to the dock button of the tab that was open.
 */
export function DoctorTablet({ open, onOpenChange, onSceneClick, tab, onTabChange, unseenResults, title, placing, sheet, children }: DoctorTabletProps) {
  const st = useST()
  const reduced = useReducedMotion()
  const node = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (body.current) body.current.scrollTop = 0
  }, [tab, placing, title])
  // A digit key changes the tab behind a focused tab button: keep the focus ring on the active one.
  useLayoutEffect(() => {
    const el = node.current
    if (!open || !el || !(document.activeElement instanceof HTMLElement) || document.activeElement.getAttribute('role') !== 'tab') return
    el.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.focus()
  }, [open, tab])

  // Placing a bed swaps the view for the tabs: the focused bed button is gone, so hand focus to the active tab.
  const wasPlacing = useRef(placing)
  useLayoutEffect(() => {
    if (wasPlacing.current && !placing) node.current?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')?.focus()
    wasPlacing.current = placing
  }, [placing])

  // The tablet grows from, and shrinks back to, the centre of the open tab's dock button.
  useLayoutEffect(() => {
    const el = node.current
    const btn = document.querySelector<HTMLElement>(`[data-dock-tab="${tab}"]`)
    if (!open || !el || !btn) return
    const b = btn.getBoundingClientRect()
    el.style.transformOrigin = `${Math.round(b.left + b.width / 2 - el.offsetLeft)}px ${Math.round(b.top + b.height / 2 - el.offsetTop)}px`
  }, [open, tab])

  const hidden = reduced ? { opacity: 0 } : sheet ? { y: '100%' } : { opacity: 0, scale: 0.7 }
  const shown = reduced ? { opacity: 1 } : sheet ? { y: 0 } : { opacity: 1, scale: 1 }
  const transition = reduced ? crossFade : spring.default

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay forceMount asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-ink-1/20"
                style={{ pointerEvents: 'none' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={crossFade}
              />
            </DialogPrimitive.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
              <DialogPrimitive.Content
                forceMount
                asChild
                data-tablet=""
                aria-describedby={undefined}
                onInteractOutside={(e) => {
                  if (!(e.target instanceof Element)) return
                  if (e.target.closest('[data-testid="hud-dock"], [data-keep-tablet]')) return e.preventDefault()
                  if (e.target.closest('canvas')) {
                    e.preventDefault()
                    window.addEventListener('click', () => setTimeout(onSceneClick, 0), { once: true, capture: true })
                  }
                }}
                onCloseAutoFocus={(e) => {
                  e.preventDefault()
                  document.querySelector<HTMLElement>(`[data-dock-tab="${tab}"]`)?.focus()
                }}
              >
                <motion.div
                  ref={node}
                  initial={hidden}
                  animate={shown}
                  exit={hidden}
                  transition={transition}
                  className="pointer-events-auto flex h-[85dvh] w-full flex-col rounded-t-[20px] bg-ink-2 p-2 pb-0 outline-none sm:h-[min(640px,80vh)] sm:w-[min(920px,90vw)] sm:rounded-[20px] sm:p-2.5"
                >
                  <DialogPrimitive.Title className="sr-only">{st('hud.tablet')}</DialogPrimitive.Title>
                  <Tabs value={tab} onValueChange={(v) => onTabChange(v as PanelTab)} className="min-h-0 flex-1 gap-0 overflow-hidden rounded-t-[12px] bg-ground sm:rounded-[10px]">
                    <div className="flex shrink-0 items-center gap-2 border-b border-line bg-chrome px-3 py-2">
                      <div className="min-w-0 flex-1 basis-0">
                        <p className={cn('truncate text-body-s font-semibold text-ink-1', !placing && 'max-sm:sr-only')} data-testid="tablet-title">
                          {title}
                        </p>
                      </div>
                      {!placing && <TabletTabs value={tab} unseenResults={unseenResults} />}
                      <div className="flex flex-1 basis-0 justify-end">
                        <DialogPrimitive.Close
                          aria-label={st('hud.close')}
                          className="grid size-11 shrink-0 place-items-center rounded-row text-ink-3 transition-[background-color,color] duration-100 hover:bg-hover hover:text-ink-1 md:size-9"
                        >
                          <X className="size-4" strokeWidth={2} aria-hidden="true" />
                        </DialogPrimitive.Close>
                      </div>
                    </div>
                    <div className="relative min-h-0 flex-1">
                      <div ref={body} className="absolute inset-0 overflow-y-auto overscroll-contain">{children}</div>
                    </div>
                  </Tabs>
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
