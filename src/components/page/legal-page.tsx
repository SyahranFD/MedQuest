import type { ReactNode } from 'react'
import { useT } from '@/lib/i18n'
import { PageBody } from './page-body'
import { PageHeader } from './page-header'

export interface LegalSection {
  id: string
  title: string
  body: ReactNode
}

interface LegalPageProps {
  title: string
  /** Already formatted date shown as "Terakhir diperbarui ...". */
  updated: string
  intro?: ReactNode
  sections: readonly LegalSection[]
}

/** Terms and privacy layout: header, sticky contents list on desktop, readable article column. */
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  const t = useT()
  return (
    <PageBody>
      <PageHeader title={title} description={intro} eyebrow={<p className="text-body-s text-ink-muted">{t('legal.updated', { date: updated })}</p>} />
      <div className="grid gap-10 pt-6 lg:grid-cols-[14rem_1fr]">
        <nav aria-label={t('legal.onThisPage')} className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-1">
            <p className="pb-2 text-label font-semibold text-ink-muted uppercase">{t('legal.onThisPage')}</p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-xs py-1 text-body-s text-ink-2 transition-colors duration-100 hover:text-ink-1"
              >
                {s.title}
              </a>
            ))}
          </div>
        </nav>
        <article className="flex max-w-prose flex-col gap-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-24 flex-col gap-3">
              <h2 className="font-display text-heading-section font-semibold text-ink-1">{s.title}</h2>
              <div className="flex flex-col gap-3 text-body text-ink-2 [&_a]:text-primary-hover [&_a]:underline [&_li]:ml-5 [&_ul]:list-disc">
                {s.body}
              </div>
            </section>
          ))}
        </article>
      </div>
    </PageBody>
  )
}
