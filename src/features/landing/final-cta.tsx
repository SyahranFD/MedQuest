import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { ClayCluster, ClayFallback } from '@/features/landing-3d'
import { LazyMount } from './lazy-mount'
import { Section } from './section'
import { useDesktop } from './use-desktop'
import { useLT } from './use-lt'

export function FinalCta() {
  const lt = useLT()
  const desktop = useDesktop()
  const fallback = <ClayFallback variant="cta" className="size-full" />
  return (
    <Section labelledBy="cta-title" className="pb-8 md:pb-12">
      <div className="grid items-center gap-8 overflow-hidden rounded-xl bg-panel p-6 sm:p-10 md:grid-cols-[1.1fr_1fr] md:p-14">
        <Reveal className="flex flex-col items-start gap-5">
          <h2 id="cta-title" className="max-w-[14ch] font-display text-heading-page font-semibold text-ink-1">
            {lt('cta.title')}
          </h2>
          <p className="max-w-[42ch] text-lead text-ink-2">{lt('cta.body')}</p>
          <Button asChild size="lg">
            <Link to={'/app' as '/'}>{lt('hero.cta')}</Link>
          </Button>
        </Reveal>
        <div aria-hidden="true" className="relative mx-auto aspect-[2/1] w-full">
          {desktop ? (
            <LazyMount className="size-full" placeholder={fallback}>
              <ClayCluster variant="cta" className="size-full" />
            </LazyMount>
          ) : (
            fallback
          )}
        </div>
      </div>
    </Section>
  )
}
