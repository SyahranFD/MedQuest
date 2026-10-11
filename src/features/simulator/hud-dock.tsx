import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { Kbd } from '@/components/ui/kbd'
import { TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { PANEL_TABS, type PanelTab } from './encounter-panel'
import { useST } from './use-st'

const HINT_KEY = 'mq-hud-hint'
const HINT_MS = 9000
/** Pressing a patient opens the tablet here, so this is where the hint points. */
const FIRST_STOP: PanelTab = 'exam'

function hintSeen() {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return true
  }
}

function rememberHint() {
  try {
    localStorage.setItem(HINT_KEY, '1')
  } catch {
    // storage unavailable: the hint may show again, which is harmless
  }
}

interface HudDockProps {
  /** The open tablet's tab, or null while the tablet is closed. */
  active: PanelTab | null
  unseenResults: number
  disabled?: boolean
  onPress: (tab: PanelTab) => void
}

/** One-time hint on the first dock button: stays for a few seconds on the first load, ends on the first press. */
function useFirstHint(dismissed: boolean) {
  const [shown, setShown] = useState(() => !hintSeen())
  useEffect(() => {
    if (!shown) return
    rememberHint()
    const id = setTimeout(() => setShown(false), HINT_MS)
    return () => clearTimeout(id)
  }, [shown])
  if (dismissed && shown) setShown(false)
  return shown
}

/** Bottom-center floating dock: five tools, 44px targets, ink fill for the open one. */
export function HudDock({ active, unseenResults, disabled, onPress }: HudDockProps) {
  const st = useST()
  const hint = useFirstHint(active !== null)
  const [hovered, setHovered] = useState<PanelTab | null>(null)

  return (
    <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={400}>
      <nav
        aria-label={st('hud.dock')}
        data-testid="hud-dock"
        className="mq-translucent pointer-events-auto mx-auto flex w-fit items-center gap-1 rounded-full border border-line p-1"
      >
        {PANEL_TABS.map(({ id, icon: Icon }, i) => {
          const isActive = active === id
          const dot = id === 'orders' && unseenResults > 0
          const label = st(`tab.${id}`)
          return (
            <TooltipPrimitive.Root
              key={id}
              open={hovered === id || (hint && id === FIRST_STOP)}
              onOpenChange={(o) => setHovered(o ? id : (h) => (h === id ? null : h))}
            >
              <TooltipPrimitive.Trigger asChild>
                <button
                  type="button"
                  data-dock-tab={id}
                  disabled={disabled}
                  aria-label={dot ? `${label}, ${st('hud.newResults', { n: unseenResults })}` : label}
                  aria-keyshortcuts={String(i + 1)}
                  aria-haspopup="dialog"
                  aria-expanded={isActive}
                  onClick={() => onPress(id)}
                  className={cn(
                    'relative grid size-11 place-items-center rounded-full text-ink-3 transition-[background-color,color,transform] duration-100 ease-out active:scale-[.94] disabled:pointer-events-none disabled:text-ink-4',
                    isActive ? 'bg-ink-1 text-primary-ink' : 'hover:bg-hover hover:text-ink-1',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  {dot && <span aria-hidden="true" data-testid="dock-dot" className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-primary ring-2 ring-surface" />}
                </button>
              </TooltipPrimitive.Trigger>
              <TooltipContent side="top" sideOffset={10} container={document.getElementById('main')} className="flex items-center gap-2">
                {hint && id === FIRST_STOP && hovered !== id ? st('hud.dockHint', { n: i + 1 }) : label}
                <Kbd className="border-primary-ink/30 bg-transparent text-primary-ink">{i + 1}</Kbd>
              </TooltipContent>
            </TooltipPrimitive.Root>
          )
        })}
      </nav>
    </TooltipPrimitive.Provider>
  )
}
