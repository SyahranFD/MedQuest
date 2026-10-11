import {
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  ClipboardCheck,
  FlaskConical,
  HeartPulse,
  MessageCircle,
  Pill,
  ShieldAlert,
  Stethoscope,
  Target,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { DIMENSIONS, DIMENSION_LABELS } from '@/features/cases/types'
import type { CriterionResult, Dimension, EmotionTracePoint, Evaluation, TimelineItem, Verdict } from '@/features/cases/types'
import { formatClock } from '@/features/session/helpers'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { BAND_VARIANT } from './band'
import { TrustSparkline } from './trust-sparkline'
import { useST } from './use-st'

// Status colour lives on the glyph only; the verdict word is plain text.
const VERDICT: Record<Verdict, { icon: LucideIcon; tone: string }> = {
  met: { icon: CircleCheck, tone: 'text-success' },
  'partially-met': { icon: CircleDashed, tone: 'text-ink-3' },
  missed: { icon: CircleX, tone: 'text-danger' },
}

const TIMELINE_ICON: Record<TimelineItem['kind'], LucideIcon> = {
  ask: MessageCircle,
  chat: MessageCircle,
  exam: Stethoscope,
  test: FlaskConical,
  result: FlaskConical,
  treat: Pill,
  dx: ClipboardCheck,
  dispo: ClipboardCheck,
  stage: HeartPulse,
  triage: ShieldAlert,
}

/** "Perhimpunan ... (PERKI)" becomes "PERKI"; issuers without a bracketed acronym stay whole. */
export function issuerShort(issuer: string) {
  return /\(([^)]+)\)/.exec(issuer)?.[1] ?? issuer
}

interface DebriefViewProps {
  evaluation: Evaluation
  trace?: readonly EmotionTracePoint[] | null
  /** Retry / other case / history buttons, supplied by the page (keeps this view router-free). */
  actions: ReactNode
}

export function DebriefView({ evaluation: e, trace, actions }: DebriefViewProps) {
  const st = useST()
  const [locale] = useLocale()
  const dimLabel = (d: Dimension) => (locale === 'en' ? (DIMENSION_LABELS[d].en ?? DIMENSION_LABELS[d].id) : DIMENSION_LABELS[d].id)
  const takeaways = [
    ...e.highlights.slice(0, 1).map((text) => ({ text, good: true })),
    ...e.improvements.slice(0, 2).map((text) => ({ text, good: false })),
  ]

  return (
    <article className="flex flex-col gap-10" aria-label={st('debrief.title')} data-testid="debrief">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-meta text-ink-3">{e.caseTitle}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-display text-heading-page font-semibold text-ink-1 tabular-nums" data-testid="debrief-percent">
              {e.percent}
              <span className="text-title text-ink-3">%</span>
            </span>
            <Badge variant={BAND_VARIANT[e.band]} data-testid="debrief-band">
              {st(`band.${e.band}`)}
            </Badge>
          </div>
          <p className="max-w-prose text-section font-semibold text-ink-1">{e.headline}</p>
          {e.capped && <p className="text-body-s text-ink-3">{st('debrief.capped')}</p>}
        </div>

        {takeaways.length > 0 && (
          <section aria-label={st('debrief.takeaways')}>
            <h2 className="sr-only">{st('debrief.takeaways')}</h2>
            <ul className="flex flex-col gap-2">
              {takeaways.map((t) => (
                <li key={t.text} className="flex items-start gap-2.5 text-body-s text-ink-2">
                  {t.good ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Target className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.5} aria-hidden="true" />
                  )}
                  {t.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      </header>

      {e.breaches.length > 0 && (
        <section aria-label={st('debrief.breach')} className="flex flex-col gap-3 rounded-card border border-danger bg-raised p-5" data-testid="safety-breach">
          <Badge variant="danger">
            <TriangleAlert aria-hidden="true" />
            {st('debrief.breach')}
          </Badge>
          <ul className="flex flex-col gap-3">
            {e.breaches.map((b) => (
              <li key={b.id} className="flex flex-col gap-1.5">
                <p className="text-body-s font-medium text-ink-1">{b.what}</p>
                {b.cite && <Cite cite={b.cite} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label={st('debrief.dimensions')} className="flex flex-col">
        <h2 className="pb-3 font-display text-section font-semibold text-ink-1">{st('debrief.dimensions')}</h2>
        <div className="border-t border-line-soft">
          {DIMENSIONS.map((d, i) => {
            const rows = e.criteria.filter((c) => c.dimension === d)
            const { percent, raw, max } = e.dimensions[d]
            return (
              <Group
                key={d}
                defaultOpen={rows.some((c) => c.verdict !== 'met')}
                empty={rows.length === 0}
                title={<DimensionHead label={dimLabel(d)} percent={percent} raw={raw} max={max} delay={i * 70} />}
              >
                <ul className="flex flex-col divide-y divide-line-soft">
                  {rows.map((c) => (
                    <CriterionRow key={c.id} c={c} />
                  ))}
                </ul>
              </Group>
            )
          })}
        </div>
      </section>

      <section aria-label={st('debrief.empathy')} className="flex flex-col gap-3" data-testid="empathy">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-section font-semibold text-ink-1">{st('debrief.empathy')}</h2>
          <p className="text-body-s font-medium text-ink-1 tabular-nums">
            {e.empathyScore}
            <span className="text-ink-3">/100</span>
          </p>
        </div>
        <p className="text-body-s text-ink-3">{st('debrief.empathyBody')}</p>
        {trace && trace.length >= 2 ? (
          <div className="flex flex-col gap-1">
            <TrustSparkline trace={trace} />
            <p className="text-meta text-ink-3">{st('debrief.sparkCaption')}</p>
          </div>
        ) : (
          <p className="text-meta text-ink-3">{st('debrief.noTrace')}</p>
        )}
      </section>

      <section aria-label={st('debrief.notes')} className="flex flex-col">
        <h2 className="pb-3 font-display text-section font-semibold text-ink-1">{st('debrief.notes')}</h2>
        <div className="border-t border-line-soft">
          <Group title={<GroupTitle>{st('debrief.timeline')}</GroupTitle>}>
            {e.timeline.length === 0 ? (
              <p className="text-body-s text-ink-3">{st('debrief.timelineEmpty')}</p>
            ) : (
              <ol className="flex flex-col" data-testid="timeline">
                {e.timeline.map((item, i) => {
                  const Icon = TIMELINE_ICON[item.kind]
                  return (
                    <li key={i} className="grid grid-cols-[3.25rem_1.5rem_1fr] items-start gap-2 py-1.5 text-body-s">
                      <time className="pt-0.5 font-mono text-meta text-ink-3 tabular-nums">{formatClock(item.atSec)}</time>
                      <Icon className="mt-0.5 size-4 text-ink-3" strokeWidth={1.5} aria-hidden="true" />
                      <span className="text-ink-1">{item.label}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </Group>
          <Group title={<GroupTitle>{st('debrief.highlights')}</GroupTitle>}>
            <BulletList items={e.highlights} empty={st('debrief.noHighlights')} />
          </Group>
          <Group title={<GroupTitle>{st('debrief.improvements')}</GroupTitle>}>
            <BulletList items={e.improvements} empty={st('debrief.noImprovements')} />
          </Group>
          <Group title={<GroupTitle>{st('debrief.narrative')}</GroupTitle>}>
            <div className="flex flex-col gap-3">
              <p className="max-w-prose text-body-s text-ink-2">{e.narrative}</p>
              {e.teachingPoints.length > 0 && (
                <>
                  <h3 className="pt-1 text-body-s font-medium text-ink-1">{st('debrief.teaching')}</h3>
                  <BulletList items={e.teachingPoints} empty="" />
                </>
              )}
            </div>
          </Group>
        </div>
      </section>

      <p className="flex items-start gap-2 text-meta text-ink-3">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {st('debrief.disclaimer')}
      </p>
    </article>
  )
}

function BulletList({ items, empty }: { items: readonly string[]; empty: string }) {
  if (items.length === 0) return <p className="text-body-s text-ink-3">{empty}</p>
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
      {items.map((h) => (
        <li key={h}>{h}</li>
      ))}
    </ul>
  )
}

function GroupTitle({ children }: { children: ReactNode }) {
  return <span className="text-body-s font-medium text-ink-1">{children}</span>
}

/** Hairline collapsible group on a native <details>: keyboard and screen-reader behaviour for free. */
function Group({ title, children, defaultOpen = false, empty = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean; empty?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  if (empty) return <div className="min-h-12 border-b border-line-soft py-3">{title}</div>
  return (
    <details open={open} onToggle={(ev) => setOpen(ev.currentTarget.open)} className="group border-b border-line-soft">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-row py-3 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">{title}</div>
        <ChevronRight
          className="size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-out group-open:rotate-90 motion-reduce:transition-none"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  )
}

function DimensionHead({ label, percent, raw, max, delay }: { label: string; percent: number; raw: number; max: number; delay: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-body-s">
        <span className="font-medium text-ink-1">{label}</span>
        <span className="text-ink-3 tabular-nums">
          <span className="font-medium text-ink-1">{percent}%</span> ({raw}/{max})
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 overflow-hidden rounded-full bg-inset">
        <div
          className="h-full origin-left rounded-full bg-ink-2 transition-transform duration-700 ease-[var(--mq-ease-out)] motion-reduce:transition-none"
          style={{ transform: `scaleX(${shown ? percent / 100 : 0})`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  )
}

function Cite({ cite }: { cite: NonNullable<CriterionResult['cite']> }) {
  return (
    <p className="flex items-start gap-1.5 text-meta text-ink-3" data-testid="cite-chip">
      <BookOpen className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <span>
        {issuerShort(cite.issuer)}
        {cite.year ? ` ${cite.year}` : ''}: {cite.title}
      </span>
    </p>
  )
}

function CriterionRow({ c }: { c: CriterionResult }) {
  const st = useST()
  const v = VERDICT[c.verdict]
  return (
    <li className="flex flex-col gap-1 py-3" data-testid="criterion" data-verdict={c.verdict}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-2 text-body-s font-medium text-ink-1">
          <v.icon className={cn('mt-0.5 size-4 shrink-0', v.tone)} strokeWidth={1.75} aria-hidden="true" />
          {c.label}
        </span>
        <span className={cn('shrink-0 text-meta', c.verdict === 'met' ? 'sr-only' : 'text-ink-3')}>{st(`verdict.${c.verdict}`)}</span>
      </div>
      <p className="pl-6 text-body-s text-ink-3">{c.evidence}</p>
      {c.cite && (
        <div className="pl-6">
          <Cite cite={c.cite} />
        </div>
      )}
    </li>
  )
}
