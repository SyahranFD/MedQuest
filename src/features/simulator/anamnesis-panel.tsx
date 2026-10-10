import { Check, SendHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
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
  const hotkeys = useMemo(() => new Map(unused.slice(0, 9).map((q, i) => [q.id, i + 1])), [unused])
  const total = catalogue.reduce((n, g) => n + g.questions.length, 0)

  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const onAskRef = useRef(onAsk)
  useEffect(() => {
    onAskRef.current = onAsk
  })

  useEffect(() => {
    if (focusToken > 0) inputRef.current?.focus()
  }, [focusToken])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"]')) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > 9) return
      const q = unused[n - 1]
      if (!q) return
      e.preventDefault()
      onAskRef.current(q.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [unused])

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
    <div className="flex flex-col gap-4" data-testid="anamnesis-panel">
      <div className="flex flex-col gap-2">
        <h3 className="text-body-s font-semibold text-ink-1">{st('anamnesis.conversation')}</h3>
        <div
          ref={logRef}
          role="log"
          aria-label={st('anamnesis.conversation')}
          className="flex max-h-56 min-h-28 flex-col gap-2 overflow-y-auto rounded-md border border-line bg-surface p-3"
        >
          <Bubble who="patient" text={caseDef.greeting} />
          {patient.log.chat.map((m, i) => (
            <Bubble key={i} who={m.who} text={m.text} tone={m.tone} toneLabel={m.tone ? st(`tone.${m.tone}`) : undefined} />
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
        <p className="flex items-center gap-1.5 text-label text-ink-muted">
          <Kbd>/</Kbd> {st('anamnesis.focusHint')}
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={st('anamnesis.quickTitle')}>
          {(['quick1', 'quick2', 'quick3'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onSend(st(`anamnesis.${k}`))}
              className="min-h-11 rounded-full border border-line-strong px-3 text-left text-label font-medium text-ink-2 transition-[background-color,transform] duration-100 hover:bg-panel active:scale-[.985] md:min-h-9"
            >
              {st(`anamnesis.${k}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-body-s font-semibold text-ink-1">{st('anamnesis.questions')}</h3>
          <span className="text-label font-medium text-ink-muted tabular-nums" data-testid="question-counter">
            {st('anamnesis.counter', { used: total - unused.length, total })}
          </span>
        </div>
        {catalogue.map((g) => (
          <section key={g.category} aria-label={categoryLabel(g)} className="flex flex-col gap-1.5">
            <h4 className="text-label font-semibold text-ink-muted uppercase">{categoryLabel(g)}</h4>
            <ul className="flex flex-col gap-1.5">
              {g.questions.map((q) => {
                const used = askedIds.includes(q.id)
                const key = hotkeys.get(q.id)
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      disabled={used}
                      aria-keyshortcuts={key ? String(key) : undefined}
                      onClick={() => onAsk(q.id)}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-2.5 rounded-sm border px-3 py-2 text-left text-body-s transition-[background-color,transform,color] duration-100 select-none',
                        used
                          ? 'border-transparent bg-panel text-ink-muted'
                          : 'border-line-strong bg-surface text-ink-1 hover:bg-panel active:scale-[.985] active:bg-inset',
                      )}
                    >
                      <span className="flex-1">{q.question}</span>
                      {used ? (
                        <>
                          <Check className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                          <span className="sr-only">{st('anamnesis.asked')}</span>
                        </>
                      ) : key ? (
                        <Kbd className="hidden md:inline-flex">{key}</Kbd>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
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
          mine ? 'rounded-br-xs bg-primary text-primary-ink' : 'rounded-bl-xs bg-panel text-ink-1',
        )}
      >
        {text}
      </p>
      {mine && tone && toneLabel && <Badge variant={TONE_BADGE[tone]}>{toneLabel}</Badge>}
    </div>
  )
}
