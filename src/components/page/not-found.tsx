import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/shell/logo'
import { useT } from '@/lib/i18n'

/** Root router `defaultNotFoundComponent`. Standalone: no shell, so it works on every surface. */
export function NotFound() {
  const t = useT()
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ground px-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <LogoMark className="size-16" />
        <p aria-hidden="true" className="font-display text-display font-bold text-ink-3">404</p>
        <h1 className="font-display text-heading-section font-semibold text-ink-1">{t('state.notFound.title')}</h1>
        <p className="text-body text-ink-2">{t('state.notFound.body')}</p>
        <Button asChild size="lg" className="mt-2">
          <Link to="/">{t('state.notFound.cta')}</Link>
        </Button>
      </div>
    </main>
  )
}
