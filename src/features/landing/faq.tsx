import { ChevronDown } from 'lucide-react'
import { Reveal } from '@/components/ui/reveal'
import { Section } from './section'
import { useLT } from './use-lt'

const ITEMS = ['faq.1', 'faq.2', 'faq.3', 'faq.4', 'faq.5'] as const

/** Native disclosure (details/summary): keyboard and screen reader behaviour comes from the platform. */
export function Faq() {
  const lt = useLT()
  return (
    <Section id="faq" labelledBy="faq-title">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <h2 id="faq-title" className="font-display text-heading-page font-semibold text-ink-1">
            {lt('faq.title')}
          </h2>
        </Reveal>
        <Reveal className="mt-10 border-t border-line">
          {ITEMS.map((item) => {
            const n = item.slice(-1)
            return (
              <details key={item} className="mq-disclosure group border-b border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xs py-4 font-display text-heading-card font-semibold text-ink-1 marker:hidden [&::-webkit-details-marker]:hidden">
                  {lt(`faq.q${n}`)}
                  <ChevronDown
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-ink-2 transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <p className="max-w-[60ch] pb-6 text-body text-ink-2">{lt(`faq.a${n}`)}</p>
              </details>
            )
          })}
        </Reveal>
      </div>
    </Section>
  )
}
