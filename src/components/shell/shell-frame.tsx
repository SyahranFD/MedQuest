import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { spring, useReducedMotion } from '@/lib/motion'
import { useT, type CoreKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Breadcrumbs, RouteAnnouncer } from './breadcrumbs'
import { LocaleToggle } from './locale-toggle'
import { LogoMark } from './logo'
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

  return (
    <div data-slot="shell" className="min-h-dvh bg-ground lg:grid lg:grid-cols-[15rem_1fr]">
      <RouteProgress />
      <RouteAnnouncer />

      <aside className="hidden border-r border-line bg-panel lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-8 lg:px-3 lg:py-5">
        <Link to="/" className="flex items-center gap-2.5 rounded-sm px-2 py-1">
          <LogoMark className="size-9" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-body font-bold text-ink-1">{t('brand.name')}</span>
            <span className="text-label text-ink-muted">{t(area)}</span>
          </span>
        </Link>
        <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(pathname, item)
            return (
              <Link
                key={item.to}
                to={item.to as '/'}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-11 items-center gap-3 rounded-sm px-3 text-body-s font-medium transition-colors duration-100 ease-out active:scale-[.985]',
                  active ? 'text-ink-1' : 'text-ink-2 hover:text-ink-1',
                )}
              >
                {active && (
                  <motion.span
                    layoutId={indicatorId}
                    transition={reduced ? { duration: 0 } : spring.default}
                    className="absolute inset-0 rounded-sm border border-line bg-surface"
                  />
                )}
                <item.icon
                  className={cn('relative', active && 'text-primary-hover')}
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

      <div className="flex min-w-0 flex-col">
        <header className="mq-translucent sticky top-0 z-30 flex h-[var(--mq-shell-nav)] items-center gap-3 px-4 sm:px-6">
          <Link to="/" aria-label={t('brand.name')} className="grid size-11 place-items-center lg:hidden">
            <LogoMark className="size-9" />
          </Link>
          <div className="min-w-0 flex-1">
            <Breadcrumbs />
          </div>
          {actions}
          <LocaleToggle />
        </header>
        <div className="flex-1 pb-24 lg:pb-0">{children}</div>
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
                active ? 'text-primary-hover' : 'text-ink-muted',
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
