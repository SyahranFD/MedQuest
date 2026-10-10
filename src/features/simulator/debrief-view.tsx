import {
  BookOpen,
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

const VERDICT: Record<Verdict, { variant: 'success' | 'warning' | 'danger'; icon: LucideIcon }> = {
  met: { variant: 'success', icon: CircleCheck },
  'partially-met': { variant: 'warning', icon: CircleDashed },
  missed: { variant: 'danger', icon: CircleX },
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

  return (
    <article className="flex flex-col gap-6" aria-label={st('debrief.title')} data-testid="debrief">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-5">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-label font-semibold text-ink-muted uppercase">{e.caseTitle}</p>
          <p className="font-display text-heading-section font-bold text-ink-1">{e.headline}</p>
          {e.capped && <p className="text-body-s text-ink-2">{st('debrief.capped')}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-display font-bold text-ink-1 tabular-nums" data-testid="debrief-percent">
            {e.percent}
            <span className="text-heading-card text-ink-muted">%</span>
          </span>
          <Badge variant={BAND_VARIANT[e.band]} className="px-3 py-1 text-body-s" data-testid="debrief-band">
            {st(`band.${e.band}`)}
          </Badge>
        </div>
      </header>

      {e.breaches.length > 0 && (
        <section aria-label={st('debrief.breach')} className="flex flex-col gap-3 rounded-lg border-2 border-danger bg-surface p-5" data-testid="safety-breach">
          <Badge variant="danger" className="self-start">
            <TriangleAlert aria-hidden="true" />
            {st('debrief.breach')}
          </Badge>
          <ul className="flex flex-col gap-3">
            {e.breaches.map((b) => (
              <li key={b.id} className="flex flex-col gap-2">
                <p className="text-body font-semibold text-ink-1">{b.what}</p>
                {b.cite && <CiteChip cite={b.cite} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label={st('debrief.dimensions')} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.dimensions')}</h2>
          <ul className="flex flex-col gap-3.5">
            {DIMENSIONS.map((d, i) => (
              <DimensionBar key={d} label={dimLabel(d)} percent={e.dimensions[d].percent} raw={e.dimensions[d].raw} max={e.dimensions[d].max} delay={i * 70} />
            ))}
          </ul>
        </section>

        <section aria-label={st('debrief.empathy')} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5" data-testid="empathy">
          <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.empathy')}</h2>
          <p className="font-display text-heading-page font-bold text-ink-1 tabular-nums">
            {e.empathyScore}
            <span className="text-heading-card text-ink-muted">/100</span>
          </p>
          <p className="text-body-s text-ink-2">{st('debrief.empathyBody')}</p>
          {trace && trace.length >= 2 ? (
            <div className="flex flex-col gap-1">
              <TrustSparkline trace={trace} />
              <p className="text-label text-ink-muted">{st('debrief.sparkCaption')}</p>
            </div>
          ) : (
            <p className="text-label text-ink-muted">{st('debrief.noTrace')}</p>
          )}
        </section>
      </div>

      <section aria-label={st('debrief.criteria')} className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.criteria')}</h2>
        {DIMENSIONS.map((d) => {
          const rows = e.criteria.filter((c) => c.dimension === d)
          if (rows.length === 0) return null
          return (
            <div key={d} className="flex flex-col gap-2">
              <h3 className="text-label font-semibold text-ink-muted uppercase">{dimLabel(d)}</h3>
              <ul className="flex flex-col divide-y divide-line">
                {rows.map((c) => (
                  <CriterionRow key={c.id} c={c} />
                ))}
              </ul>
            </div>
          )
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label={st('debrief.timeline')} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.timeline')}</h2>
          {e.timeline.length === 0 ? (
            <p className="text-body-s text-ink-muted">{st('debrief.timelineEmpty')}</p>
          ) : (
            <ol className="flex flex-col" data-testid="timeline">
              {e.timeline.map((item, i) => {
                const Icon = TIMELINE_ICON[item.kind]
                return (
                  <li key={i} className="grid grid-cols-[3.25rem_1.5rem_1fr] items-start gap-2 py-1.5 text-body-s">
                    <time className="pt-0.5 font-mono text-label text-ink-muted tabular-nums">{formatClock(item.atSec)}</time>
                    <Icon className="mt-0.5 size-4 text-ink-2" aria-hidden="true" />
                    <span className="text-ink-1">{item.label}</span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-label={st('debrief.highlights')} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
            <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.highlights')}</h2>
            {e.highlights.length === 0 ? (
              <p className="text-body-s text-ink-muted">{st('debrief.noHighlights')}</p>
            ) : (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label={st('debrief.improvements')} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
            <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.improvements')}</h2>
            {e.improvements.length === 0 ? (
              <p className="text-body-s text-ink-muted">{st('debrief.noImprovements')}</p>
            ) : (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
                {e.improvements.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section aria-label={st('debrief.narrative')} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('debrief.narrative')}</h2>
        <p className="max-w-prose text-body text-ink-2">{e.narrative}</p>
        {e.teachingPoints.length > 0 && (
          <>
            <h3 className="pt-1 text-label font-semibold text-ink-muted uppercase">{st('debrief.teaching')}</h3>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
              {e.teachingPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}
        <p className="flex items-start gap-2 pt-1 text-label text-ink-muted">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {st('debrief.disclaimer')}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">{actions}</div>
    </article>
  )
}

function DimensionBar({ label, percent, raw, max, delay }: { label: string; percent: number; raw: number; max: number; delay: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-body-s">
        <span className="font-medium text-ink-1">{label}</span>
        <span className="text-ink-2 tabular-nums">
          <span className="font-semibold text-ink-1">{percent}%</span> ({raw}/{max})
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-2.5 overflow-hidden rounded-full bg-inset">
        <div
          className="h-full origin-left rounded-full bg-primary transition-transform duration-700 ease-[var(--mq-ease-out)] motion-reduce:transition-none"
          style={{ transform: `scaleX(${shown ? percent / 100 : 0})`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </li>
  )
}

function CiteChip({ cite }: { cite: NonNullable<CriterionResult['cite']> }) {
  return (
    <Badge variant="neutral" className="h-auto max-w-full items-start gap-1.5 rounded-sm py-1 whitespace-normal" data-testid="cite-chip">
      <BookOpen className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        {issuerShort(cite.issuer)}
        {cite.year ? ` ${cite.year}` : ''}: {cite.title}
      </span>
    </Badge>
  )
}

function CriterionRow({ c }: { c: CriterionResult }) {
  const st = useST()
  const v = VERDICT[c.verdict]
  return (
    <li className={cn('flex flex-col gap-1.5 py-3')} data-testid="criterion" data-verdict={c.verdict}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-2 text-body-s font-semibold text-ink-1">
          <v.icon className="mt-0.5 size-4 shrink-0 text-ink-2" aria-hidden="true" />
          {c.label}
        </span>
        <Badge variant={v.variant} className="shrink-0">
          {st(`verdict.${c.verdict}`)}
        </Badge>
      </div>
      <p className="pl-6 text-body-s text-ink-2">{c.evidence}</p>
      {c.cite && (
        <div className="pl-6">
          <CiteChip cite={c.cite} />
        </div>
      )}
    </li>
  )
}
