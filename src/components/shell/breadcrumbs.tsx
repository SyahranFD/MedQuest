import { Link, useMatches } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { useT } from '@/lib/i18n'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Breadcrumb and route-announcement title: an i18n key or a literal. */
    title?: string
  }
}

/** Crumbs from the matched routes' `staticData.title`, resolved through i18n. */
export function useCrumbs() {
  const t = useT()
  const matches = useMatches()
  return matches.flatMap((m) =>
    m.staticData.title ? [{ to: m.pathname, title: t(m.staticData.title) }] : [],
  )
}

export function Breadcrumbs() {
  const t = useT()
  const crumbs = useCrumbs()
  if (crumbs.length === 0) return null
  return (
    <nav aria-label={t('nav.breadcrumb')} data-slot="breadcrumbs" className="min-w-0">
      <ol className="flex items-center gap-1 text-body-s text-ink-2">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={c.to}>
              {i > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-ink-4" />}
              <li className="min-w-0 truncate">
                {last ? (
                  <span aria-current="page" className="font-medium text-ink-1">
                    {c.title}
                  </span>
                ) : (
                  <Link to={c.to as '/'} className="inline-flex rounded-xs pointer-coarse:min-h-11 pointer-coarse:items-center hover:text-ink-1">
                    {c.title}
                  </Link>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

/** Polite live region so screen readers hear the new page title after navigation. */
export function RouteAnnouncer() {
  const crumbs = useCrumbs()
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {crumbs.at(-1)?.title}
    </div>
  )
}
