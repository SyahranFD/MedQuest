import { useLocale, useT } from '@/lib/i18n'
import type { Locale } from '@/stores/ui'
import { cn } from '@/lib/utils'

const LOCALES: readonly Locale[] = ['id', 'en']

/** Segmented ID / EN switch bound to the UI store. */
export function LocaleToggle({ className }: { className?: string }) {
  const [locale, setLocale] = useLocale()
  const t = useT()
  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      data-slot="locale-toggle"
      className={cn('inline-flex rounded-full border border-line-strong p-0.5', className)}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={cn(
            'h-8 min-w-10 rounded-full px-2.5 text-label font-semibold uppercase transition-colors duration-100 ease-out pointer-coarse:h-11 pointer-coarse:min-w-11',
            locale === l ? 'bg-ink-1 text-surface' : 'text-ink-2 hover:text-ink-1',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
