import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useT } from '@/lib/i18n'
import { LocaleToggle } from './locale-toggle'
import { Logo } from './logo'
import { marketingLinks, NAV_ICON_SIZE, NAV_ICON_STROKE } from './nav'

/** Sticky floating pill nav. Light blur only (CLAUDE.md 8.2 rule 11). Links collapse into a sheet on mobile. */
export function MarketingNav() {
  const t = useT()
  return (
    <header data-slot="marketing-nav" className="sticky top-3 z-40 px-3 sm:px-4">
      <div className="mq-translucent mx-auto flex h-14 max-w-5xl items-center gap-2 rounded-full border border-line pr-2 pl-5">
        <Link to="/" aria-label={t('brand.name')} className="mr-auto flex min-h-11 items-center rounded-xs">
          <Logo className="h-7" />
        </Link>

        <nav aria-label={t('nav.main')} className="hidden items-center gap-1 md:flex">
          {marketingLinks.map((l) => (
            <Link
              key={l.hash}
              to={l.to}
              hash={l.hash}
              className="flex min-h-11 items-center rounded-full px-3.5 text-body-s font-medium text-ink-2 transition-colors duration-100 hover:bg-panel hover:text-ink-1"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>

        <LocaleToggle className="ml-2 hidden md:inline-flex" />

        <Button asChild size="default" className="rounded-full px-5">
          <Link to={'/app' as '/'}>{t('nav.tryDemo')}</Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label={t('nav.open')}>
              <Menu size={NAV_ICON_SIZE} strokeWidth={NAV_ICON_STROKE} />
            </Button>
          </DialogTrigger>
          <DialogContent
            className="mq-sheet inset-y-0 top-0 left-0 h-dvh max-w-xs translate-x-0 translate-y-0 justify-start rounded-none rounded-r-lg border-y-0 border-l-0 pt-16"
            aria-describedby={undefined}
          >
            <DialogTitle className="sr-only">{t('nav.main')}</DialogTitle>
            <DialogDescription className="sr-only">{t('brand.tagline')}</DialogDescription>
            <nav aria-label={t('nav.main')} className="flex flex-col gap-1">
              {marketingLinks.map((l) => (
                <DialogClose asChild key={l.hash}>
                  <Link
                    to={l.to}
                    hash={l.hash}
                    className="flex h-12 items-center rounded-sm px-3 text-body font-medium text-ink-1 hover:bg-panel"
                  >
                    {t(l.label)}
                  </Link>
                </DialogClose>
              ))}
            </nav>
            <LocaleToggle className="self-start" />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
