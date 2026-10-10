import { MarketingFooter } from '@/components/shell/marketing-footer'
import { MarketingNav } from '@/components/shell/marketing-nav'
import { EmotionShowcase } from './emotion-showcase'
import { Faq } from './faq'
import { FeatureRail } from './feature-rail'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { Institutions } from './institutions'
import { Problem } from './problem'
import { PAGE_TITLES } from './titles'
import { useDocumentTitle } from './use-document-title'

/** Every section between the nav and the footer; also what the heading test renders. */
export function LandingSections() {
  return (
    <main id="main">
      <Hero />
      <Problem />
      <HowItWorks />
      <FeatureRail />
      <EmotionShowcase />
      <Institutions />
      <Faq />
      <FinalCta />
    </main>
  )
}

export function LandingPage() {
  useDocumentTitle(PAGE_TITLES.home)
  return (
    <div>
      <MarketingNav />
      <LandingSections />
      <MarketingFooter />
    </div>
  )
}
