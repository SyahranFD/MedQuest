import { Check, SendHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Case, DialogueCategory } from '@/features/cases/types'
import { buildQuestionCatalogue } from '@/features/dialogue'
import type { CatalogueQuestion } from '@/features/dialogue'
import type { SessionPatient } from '@/features/session/types'
import { useLocale } from '@/lib/i18n'
import { useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { TONE_BADGE } from './mood'
import { useST } from './use-st'

/** Unused questions in display order: the numbered hotkeys 1 to 9 pick from this list. */
export function unusedQuestions(
  catalogue: { questions: CatalogueQuestion[] }[],
  askedIds: readonly string[],
): CatalogueQuestion[] {
  return catalogue.flatMap((g) => g.questions).filter((q) => !askedIds.includes(q.id))
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

interface AnamnesisPanelProps {
  caseDef: Case
  patient: SessionPatient
  /** Bump to focus the free-text box (the "/" shortcut). */
  focusToken?: number
  onAsk: (entryId: string) => void
  onSend: (text: string) => void
}

export function AnamnesisPanel({ caseDef, patient, focusToken = 0, onAsk, onSend }: AnamnesisPanelProps) {
  const st = useST()
  const [locale] = useLocale()
  const reduced = useReducedMotion()
  const catalogue = useMemo(() => buildQuestionCatalogue(caseDef), [caseDef])
  const askedIds = useMemo(() => patient.log.askedIds.map((a) => a.id), [patient.log.askedIds])
  const unused = useMemo(() => unusedQuestions(catalogue, askedIds), [catalogue, askedIds])
  const numbers = useMemo(() => new Map(catalogue.flatMap((g) => g.questions).map((q, i) => [q.id, i + 1])), [catalogue])
  const total = catalogue.reduce((n, g) => n + g.questions.length, 0)

  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusToken > 0) inputRef.current?.focus()
  }, [focusToken])

  const messageCount = patient.log.chat.length
  useEffect(() => {
    const el = logRef.current
    if (!el) return
    if (reduced || typeof el.scrollTo !== 'function') el.scrollTop = el.scrollHeight
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messageCount, reduced])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  const categoryLabel = (g: { category: DialogueCategory; label: { id: string; en?: string } }) =>
    locale === 'en' ? (g.label.en ?? g.label.id) : g.label.id

  return (
    <div className="flex flex-col md:h-full md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:overflow-hidden" data-testid="anamnesis-panel">
      <section aria-label={st('anamnesis.questions')} className="flex min-h-0 flex-col border-line max-md:border-b md:border-r md:overflow-y-auto">
        <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-1">
          <h3 className="text-body-s font-semibold text-ink-1">{st('anamnesis.questions')}</h3>
          <span className="text-label text-ink-muted tabular-nums" data-testid="question-counter">
            {st('anamnesis.counter', { used: total - unused.length, total })}
          </span>
        </div>
        {catalogue.map((g) => (
          <section key={g.category} aria-label={categoryLabel(g)} className="flex flex-col">
            <h4 className="px-5 pt-4 pb-1 text-label font-semibold text-ink-muted">{categoryLabel(g)}</h4>
            <ul className="flex flex-col divide-y divide-line border-y border-line">
              {g.questions.map((q) => {
                const used = askedIds.includes(q.id)
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      disabled={used}
                      onClick={() => onAsk(q.id)}
                      className={cn(
                        'flex min-h-12 w-full items-center gap-3 px-5 py-2 text-left text-body-s transition-[background-color,color] duration-100 select-none',
                        used ? 'text-ink-muted' : 'text-ink-1 hover:bg-panel active:bg-inset',
                      )}
                    >
                      <span className="w-5 shrink-0 text-[13px] text-ink-muted tabular-nums" aria-hidden="true">{numbers.get(q.id)}</span>
                      <span className="flex-1">{q.question}</span>
                      {used && (
                        <>
                          <Check className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                          <span className="sr-only">{st('anamnesis.asked')}</span>
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </section>

      <section aria-label={st('anamnesis.conversation')} className="flex min-h-0 flex-col gap-3 p-5 max-md:min-h-[22rem]">
        <h3 className="text-body-s font-semibold text-ink-1">{st('anamnesis.conversation')}</h3>
        <div ref={logRef} role="log" aria-label={st('anamnesis.conversation')} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-md bg-panel p-3">
          <Bubble who="patient" text={caseDef.greeting} />
          {patient.log.chat.map((m, i) => (
            <Bubble key={i} who={m.who} text={m.text} tone={m.tone} toneLabel={m.tone ? st(`tone.${m.tone}`) : undefined} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={st('anamnesis.quickTitle')}>
          {(['quick1', 'quick2', 'quick3'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSend(st(`anamnesis.${k}`))}
              className="min-h-11 rounded-full border border-line px-3 text-left text-label text-ink-3 transition-[background-color,color] duration-100 hover:bg-panel hover:text-ink-1 md:min-h-9"
            >
              {st(`anamnesis.${k}`)}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2" aria-label={st('anamnesis.freeText')}>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={st('anamnesis.placeholder')}
            aria-label={st('anamnesis.freeText')}
            autoComplete="off"
            enterKeyHint="send"
          />
          <Button type="submit" size="icon" aria-label={st('anamnesis.send')} disabled={!text.trim()}>
            <SendHorizontal aria-hidden="true" />
          </Button>
        </form>
      </section>
    </div>
  )
}

function Bubble({ who, text, tone, toneLabel }: { who: 'you' | 'patient'; text: string; tone?: keyof typeof TONE_BADGE; toneLabel?: string }) {
  const mine = who === 'you'
  return (
    <div className={cn('flex max-w-[88%] flex-col gap-1', mine ? 'items-end self-end' : 'items-start self-start')}>
      <p
        className={cn(
          'rounded-md px-3 py-2 text-body-s',
          mine ? 'rounded-br-xs bg-primary text-primary-ink' : 'rounded-bl-xs bg-surface text-ink-1',
        )}
      >
        {text}
      </p>
      {mine && tone && toneLabel && <Badge variant={TONE_BADGE[tone]}>{toneLabel}</Badge>}
    </div>
  )
}
