import { BadgeCheck, ChartNoAxesColumn, FlaskConical, Mail, School } from 'lucide-react'
import { Reveal, RevealGroup } from '@/components/ui/reveal'
import { Button } from '@/components/ui/button'
import { Section } from './section'
import { useLT } from './use-lt'

/** Placeholder address: replace with the team's real contact before launch. */
export const CONTACT_EMAIL = 'kontak@medquest.example'

const BLOCKS = [
  { key: 'inst.b1', icon: School },
  { key: 'inst.b2', icon: FlaskConical },
  { key: 'inst.b3', icon: ChartNoAxesColumn },
  { key: 'inst.b4', icon: BadgeCheck },
] as const

/** The one deep ink-green band on the page. Text is ground on ink (above 14:1). */
export function Institutions() {
  const lt = useLT()
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(lt('inst.mailSubject'))}`
  return (
    <Section id="institusi" labelledBy="inst-title" bleed className="mx-2 rounded-xl bg-ink-1 text-ground sm:mx-4">
      <div className="mx-auto max-w-[var(--mq-container)] px-4 sm:px-6">
        <Reveal>
          <h2 id="inst-title" className="max-w-[24ch] font-display text-heading-page font-semibold">
            {lt('inst.title')}
          </h2>
        </Reveal>
        <RevealGroup className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {BLOCKS.map(({ key, icon: Icon }) => (
            <Reveal key={key} className="flex gap-4 border-t border-ground/20 pt-6">
              <Icon size={28} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-heading-card font-semibold">{lt(`${key}.title`)}</h3>
                <p className="max-w-[44ch] text-body-s text-ground/80">{lt(`${key}.body`)}</p>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
        <Reveal className="mt-12 flex flex-col items-start gap-4">
          <Button asChild size="lg" className="bg-ground text-ink-1 hover:bg-surface active:bg-panel">
            <a href={href}>
              <Mail size={18} strokeWidth={1.75} aria-hidden="true" />
              {lt('inst.cta')}
            </a>
          </Button>
          <p className="max-w-[52ch] text-body-s text-ground/80">{lt('inst.note')}</p>
        </Reveal>
      </div>
    </Section>
  )
}
