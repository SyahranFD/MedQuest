import { Link } from '@tanstack/react-router'
import { ArrowDown, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Reveal, RevealGroup } from '@/components/ui/reveal'
import { ClayFallback, ClayHero } from '@/features/landing-3d'
import { useDesktop } from './use-desktop'
import { useLT } from './use-lt'

/** True once the browser is idle after first paint, so text and fonts settle before the three.js chunk is requested. */
function useAfterFirstPaint() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const idle = 'requestIdleCallback' in window
    const id = idle ? window.requestIdleCallback(() => setReady(true), { timeout: 1500 }) : window.setTimeout(() => setReady(true), 400)
    return () => (idle ? window.cancelIdleCallback(id) : window.clearTimeout(id))
  }, [])
  return ready
}

export function Hero() {
  const lt = useLT()
  const desktop = useDesktop()
  const canvasReady = useAfterFirstPaint()
  return (
    <section
      aria-labelledby="hero-title"
      className="mx-auto grid max-w-[var(--mq-container)] grid-cols-[minmax(0,1fr)] items-center gap-8 px-4 pt-10 pb-16 sm:px-6 md:pt-14 md:pb-24 lg:min-h-[calc(100dvh-9rem)] lg:grid-cols-[1.12fr_1fr] lg:gap-4 lg:pt-4 lg:pb-12"
    >
      <RevealGroup className="flex min-w-0 flex-col items-start gap-6">
        <h1
          id="hero-title"
          className="max-w-[15ch] font-display text-display font-semibold text-ink-1 lg:text-[length:clamp(3.25rem,5.6vw,5.25rem)] lg:tracking-[-0.032em]"
        >
          {lt('hero.title')}
        </h1>
        <Reveal>
          <p className="max-w-[46ch] text-lead text-ink-2">{lt('hero.sub')}</p>
        </Reveal>
        <Reveal className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to={'/app' as '/'}>{lt('hero.cta')}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/" hash="cara-kerja">
              {lt('hero.how')}
              <ArrowDown size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>
        <Reveal>
          <p className="flex items-center gap-2 text-body-s text-ink-muted">
            <ShieldCheck size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
            {lt('hero.trust')}
          </p>
        </Reveal>
      </RevealGroup>

      <div className="relative mx-auto aspect-[16/12] w-full max-w-[34rem] lg:-mr-6 lg:max-w-none">
        {desktop && canvasReady ? <ClayHero className="size-full" /> : <ClayFallback variant="hero" className="size-full" />}
      </div>
    </section>
  )
}
