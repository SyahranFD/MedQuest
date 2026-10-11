import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { spring, useReducedMotion } from '@/lib/motion'
import { useT, type CoreKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Breadcrumbs, RouteAnnouncer } from './breadcrumbs'
import { LocaleToggle } from './locale-toggle'
import { Logo, LogoMark } from './logo'
import { NAV_ICON_SIZE, NAV_ICON_STROKE, type NavItem } from './nav'
import { RouteProgress } from './route-progress'

export interface ShellFrameProps {
  nav: readonly NavItem[]
  /** i18n key of the caption under the wordmark, e.g. "nav.studentApp". */
  area: CoreKey
  /** Extra controls in the top bar, before the locale toggle. */
  actions?: ReactNode
  children: ReactNode
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

/** Shared by AppShell and DosenShell: sidebar on desktop, bottom bar on mobile. */
export function ShellFrame({ nav, area, actions, children }: ShellFrameProps) {
  const t = useT()
  const reduced = useReducedMotion()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const indicatorId = useId()
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = 0
  }, [pathname])

  return (
    <div data-slot="shell" className="min-h-dvh bg-chrome lg:grid lg:h-dvh lg:grid-cols-[var(--mq-sidebar)_1fr] lg:overflow-hidden">
      <RouteProgress />
      <RouteAnnouncer />

      <aside className="hidden lg:flex lg:h-dvh lg:flex-col lg:gap-8 lg:px-4 lg:py-6">
        <Link to="/" className="flex flex-col gap-1 rounded-row px-2 py-1">
          <Logo className="h-14 self-start" />
          <span className="text-body-s text-ink-2">{t(area)}</span>
        </Link>
        <nav aria-label={t('nav.main')} className="flex flex-col gap-2">
          {nav.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.to}
                to={item.to as '/'}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-11 items-center gap-3 rounded-sm px-3 text-body font-medium transition-colors duration-100 ease-out active:scale-[.985]',
                  active ? 'text-ink-1' : 'text-ink-2 hover:bg-hover hover:text-ink-1',
                )}
              >
                {active && (
                  <motion.span
                    layoutId={indicatorId}
                    transition={reduced ? { duration: 0 } : spring.default}
                    className="absolute inset-0 rounded-sm bg-raised"
                  />
                )}
                <item.icon
                  className="relative"
                  size={NAV_ICON_SIZE}
                  strokeWidth={NAV_ICON_STROKE}
                  aria-hidden="true"
                />
                <span className="relative">{t(item.label)}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col bg-ground lg:m-2 lg:ml-0 lg:min-h-0 lg:overflow-hidden lg:rounded-xl lg:border lg:border-line">
        <header className="sticky top-0 z-30 flex h-[var(--mq-header)] shrink-0 items-center gap-3 border-b border-line bg-ground px-4 sm:px-6">
          <Link to="/" aria-label={t('brand.name')} className="grid size-11 place-items-center lg:hidden">
            <LogoMark className="size-8" />
          </Link>
          <div className="min-w-0 flex-1">
            <Breadcrumbs />
          </div>
          {actions}
          <LocaleToggle />
        </header>
        <div ref={scroller} className="flex-1 pb-24 lg:overflow-y-auto lg:pb-0">
          {children}
        </div>
      </div>

      <nav
        aria-label={t('nav.main')}
        className="mq-translucent fixed inset-x-0 bottom-0 z-40 grid border-t border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map((item) => {
          const active = isActive(pathname, item)
          return (
            <Link
              key={item.to}
              to={item.to as '/'}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-0.5 text-label font-medium transition-colors duration-100 active:scale-[.97]',
                active ? 'text-ink-1' : 'text-ink-2',
              )}
            >
              <item.icon size={NAV_ICON_SIZE} strokeWidth={active ? 2.25 : NAV_ICON_STROKE} aria-hidden="true" />
              {t(item.label)}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
