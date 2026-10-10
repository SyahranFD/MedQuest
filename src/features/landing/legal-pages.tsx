import { MarketingFooter } from '@/components/shell/marketing-footer'
import { MarketingNav } from '@/components/shell/marketing-nav'
import { LegalPage, type LegalSection } from '@/components/page/legal-page'
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from './legal-messages'
import { PAGE_TITLES } from './titles'
import { useDocumentTitle } from './use-document-title'
import { useLT } from './use-lt'

function useSections(doc: 'terms' | 'privacy', ids: readonly string[]): LegalSection[] {
  const lt = useLT()
  return ids.map((id) => ({
    id,
    title: lt(`${doc}.${id}.title`),
    body: (
      <>
        <p>{lt(`${doc}.${id}.p1`)}</p>
        <p>{lt(`${doc}.${id}.p2`)}</p>
      </>
    ),
  }))
}

export function TermsPage() {
  useDocumentTitle(PAGE_TITLES.terms)
  const lt = useLT()
  const sections = useSections('terms', TERMS_SECTIONS)
  return (
    <>
      <MarketingNav />
      <LegalPage title={lt('terms.title')} updated={lt('terms.updated')} intro={lt('terms.intro')} sections={sections} />
      <MarketingFooter />
    </>
  )
}

export function PrivacyPage() {
  useDocumentTitle(PAGE_TITLES.privacy)
  const lt = useLT()
  const sections = useSections('privacy', PRIVACY_SECTIONS)
  return (
    <>
      <MarketingNav />
      <LegalPage
        title={lt('privacy.title')}
        updated={lt('privacy.updated')}
        intro={lt('privacy.intro')}
        sections={sections}
      />
      <MarketingFooter />
    </>
  )
}
