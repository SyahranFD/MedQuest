import { useRef, useState, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Reveal } from '@/components/ui/reveal'
import { EMOTIONS, type Emotion } from '@/lib/emotion'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { MoodFace } from './mood-face'
import { stepMood } from './moods'
import { Section } from './section'
import { useLT } from './use-lt'

export function EmotionShowcase() {
  const lt = useLT()
  const t = useT()
  const [mood, setMood] = useState<Emotion>('cemas')
  const refs = useRef<Partial<Record<Emotion, HTMLButtonElement | null>>>({})

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = stepMood(mood, delta)
    setMood(next)
    refs.current[next]?.focus()
  }

  return (
    <Section id="emosi" labelledBy="emotion-title">
      <Reveal>
        <h2 id="emotion-title" className="max-w-[22ch] font-display text-heading-page font-semibold text-ink-1">
          {lt('emotion.title')}
        </h2>
      </Reveal>
      <Reveal>
        <p className="mt-5 max-w-[58ch] text-lead text-ink-2">{lt('emotion.lead')}</p>
      </Reveal>

      <Reveal>
        <div
          role="radiogroup"
          aria-label={lt('emotion.pick')}
          onKeyDown={onKeyDown}
          className="mt-10 flex flex-wrap gap-2"
        >
          {EMOTIONS.map((e) => {
            const selected = e === mood
            return (
              <button
                key={e}
                ref={(el) => {
                  refs.current[e] = el
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setMood(e)}
                className={cn(
                  'flex h-11 items-center gap-2 rounded-full border py-1 pr-4 pl-1.5 text-body-s font-semibold transition-[background-color,color,border-color,transform] duration-100 ease-out active:scale-[.985]',
                  selected
                    ? 'border-primary bg-primary text-primary-ink'
                    : 'border-line-strong bg-transparent text-ink-1 hover:bg-panel',
                )}
              >
                <span className="size-8 shrink-0">
                  <MoodFace emotion={e} />
                </span>
                {t(`emotion.${e}`)}
              </button>
            )
          })}
        </div>
      </Reveal>

      <div className="mt-6 grid items-center gap-6 rounded-lg bg-tint-green p-6 sm:gap-10 sm:p-10 md:grid-cols-[auto_1fr]">
        <div className="mx-auto size-40 sm:size-56" data-testid="mood-face">
          <MoodFace emotion={mood} />
        </div>
        <div aria-live="polite" className="flex flex-col items-start gap-4">
          <Badge variant="neutral">{t(`emotion.${mood}`)}</Badge>
          <p className="font-display text-heading-section font-semibold text-ink-1 [text-wrap:pretty]">
            {'“'}
            {lt(`emotion.${mood}.quote`)}
            {'”'}
          </p>
          <p className="max-w-[56ch] text-body-s text-ink-2">
            <span className="font-semibold text-ink-1">{lt('emotion.cause')}: </span>
            {lt(`emotion.${mood}.cause`)}
          </p>
        </div>
      </div>
    </Section>
  )
}
