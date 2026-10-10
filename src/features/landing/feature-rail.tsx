import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/ui/reveal'
import { ClayFallback, ClayObjectCard, type ClayObjectName, type ClayTint } from '@/features/landing-3d'
import { useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { LazyMount } from './lazy-mount'
import { isArtKey, RailArt } from './rail-art'
import { Section } from './section'
import { useDesktop } from './use-desktop'
import { useLT } from './use-lt'

interface Feature {
  key: string
  tint: ClayTint
  /** A clay object (at most two cards); the other cards get a mini product preview from `RailArt`. */
  clay?: ClayObjectName
}

const TINT_CLASS: Record<ClayTint, string> = {
  green: 'bg-tint-green',
  blue: 'bg-tint-blue',
  coral: 'bg-tint-coral',
  amber: 'bg-tint-amber',
  teal: 'bg-tint-teal',
}

const FEATURES: readonly Feature[] = [
  { key: 'rail.f1', tint: 'green' },
  { key: 'rail.f2', tint: 'blue' },
  { key: 'rail.f3', tint: 'coral', clay: 'heart' },
  { key: 'rail.f4', tint: 'amber', clay: 'clipboard' },
  { key: 'rail.f5', tint: 'teal' },
  { key: 'rail.f6', tint: 'green' },
]

function ClayVisual({ object, tint }: { object: ClayObjectName; tint: ClayTint }) {
  const desktop = useDesktop()
  const fallback = <ClayFallback variant="card" object={object} className="size-full" />
  return (
    <div className="absolute inset-x-0 bottom-0 aspect-square" aria-hidden="true">
      {desktop ? (
        <LazyMount className="size-full" placeholder={fallback}>
          <ClayObjectCard object={object} tint={tint} className="size-full rounded-none" />
        </LazyMount>
      ) : (
        fallback
      )}
    </div>
  )
}

export function FeatureRail() {
  const lt = useLT()
  const reduced = useReducedMotion()
  const scrollerRef = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <Section id="fitur" labelledBy="rail-title" bleed>
      <div className="mx-auto flex max-w-[var(--mq-container)] items-end justify-between gap-6 px-4 sm:px-6">
        <Reveal>
          <h2 id="rail-title" className="max-w-[22ch] font-display text-heading-page font-semibold text-ink-1">
            {lt('rail.title')}
          </h2>
        </Reveal>
        <div className="hidden gap-2 md:flex">
          <Button variant="secondary" size="icon" className="rounded-full" onClick={() => scrollBy(-1)} aria-label={lt('rail.prev')}>
            <ChevronLeft size={20} strokeWidth={1.75} />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full" onClick={() => scrollBy(1)} aria-label={lt('rail.next')}>
            <ChevronRight size={20} strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        role="region"
        tabIndex={0}
        aria-label={lt('rail.region')}
        className={cn(
          'mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 outline-offset-[-4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'scroll-pl-4 pl-4 sm:scroll-pl-[max(1.5rem,calc((100%_-_var(--mq-container))/2_+_1.5rem))] sm:pl-[max(1.5rem,calc((100%_-_var(--mq-container))/2_+_1.5rem))]',
        )}
      >
        {FEATURES.map((f) => {
          return (
            <article
              key={f.key}
              className={cn(
                'relative aspect-[3/4] w-[min(18.5rem,78vw)] shrink-0 snap-start overflow-hidden rounded-lg p-6',
                TINT_CLASS[f.tint],
              )}
            >
              <div className="relative z-10 flex flex-col gap-2">
                <h3 className="font-display text-heading-card font-semibold text-ink-1">{lt(`${f.key}.title`)}</h3>
                <p className="text-body-s text-ink-2">{lt(`${f.key}.body`)}</p>
              </div>
              {f.clay && <ClayVisual object={f.clay} tint={f.tint} />}
              {isArtKey(f.key) && <RailArt name={f.key} />}
            </article>
          )
        })}
        <div aria-hidden="true" className="w-4 shrink-0 sm:w-6" />
      </div>
    </Section>
  )
}
