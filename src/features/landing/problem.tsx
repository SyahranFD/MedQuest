import { CountUp } from '@/components/ui/count-up'
import { Reveal, RevealGroup } from '@/components/ui/reveal'
import { ScrollWords } from '@/components/ui/scroll-words'
import { Section } from './section'
import { useLT } from './use-lt'

const STATS = [
  { to: 6, label: 'problem.cases' },
  { to: 8, label: 'problem.emotions' },
  { to: 6, label: 'problem.dimensions' },
  { to: 3, label: 'problem.sources' },
] as const

export function Problem() {
  const lt = useLT()
  return (
    <Section labelledBy="problem-title">
      <ScrollWords
        as="h2"
        text={lt('problem.statement')}
        className="max-w-[26ch] text-heading-page font-medium text-ink-1 sm:max-w-[34ch] lg:max-w-[38ch] lg:text-[length:clamp(2rem,3.1vw,2.9rem)]"
      />
      <span id="problem-title" className="sr-only">
        {lt('problem.stats')}
      </span>
      <RevealGroup className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line pt-10 lg:grid-cols-4">
        {STATS.map((s) => (
          <Reveal key={s.label} className="flex flex-col gap-2">
            <p className="font-display text-heading-page leading-none font-semibold text-ink-1 tabular-nums">
              <CountUp to={s.to} />
            </p>
            <p className="max-w-[24ch] text-body-s text-ink-2">{lt(s.label)}</p>
          </Reveal>
        ))}
      </RevealGroup>
      <p className="mt-8 text-body-s text-ink-muted">{lt('problem.note')}</p>
    </Section>
  )
}
