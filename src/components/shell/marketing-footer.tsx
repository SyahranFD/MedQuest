import { Link } from '@tanstack/react-router'
import { useT } from '@/lib/i18n'
import { Logo } from './logo'
import { footerLegalLinks, marketingLinks } from './nav'

const YEAR = new Date().getFullYear()

export function MarketingFooter() {
  const t = useT()
  const linkClass = 'inline-flex rounded-xs pointer-coarse:min-h-11 pointer-coarse:items-center text-body-s text-ink-2 transition-colors duration-100 hover:text-ink-1'
  return (
    <footer data-slot="marketing-footer" className="mt-24 border-t border-line bg-panel">
      <div className="mx-auto grid max-w-[var(--mq-container)] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-3">
          <Logo className="h-9 self-start" />
          <p className="text-body-s text-ink-2">{t('brand.tagline')}</p>
          <p className="text-body-s text-ink-muted">{t('footer.disclaimer')}</p>
        </div>
        <nav aria-label={t('footer.product')} className="flex flex-col gap-2.5">
          <h2 className="text-label font-semibold text-ink-muted uppercase">{t('footer.product')}</h2>
          {marketingLinks.map((l) => (
            <Link key={l.hash} to={l.to} hash={l.hash} className={linkClass}>
              {t(l.label)}
            </Link>
          ))}
          <Link to={'/app' as '/'} className={linkClass}>
            {t('nav.tryDemo')}
          </Link>
        </nav>
        <nav aria-label={t('footer.legal')} className="flex flex-col gap-2.5">
          <h2 className="text-label font-semibold text-ink-muted uppercase">{t('footer.legal')}</h2>
          {footerLegalLinks.map((l) => (
            <Link key={l.to} to={l.to as '/'} className={linkClass}>
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-[var(--mq-container)] flex-wrap justify-between gap-2 border-t border-line px-4 py-5 text-label text-ink-muted sm:px-6">
        <span>
          {t('brand.name')} {YEAR}. {t('footer.rights')}
        </span>
        <span>{t('footer.madeFor')}</span>
      </div>
    </footer>
  )
}
