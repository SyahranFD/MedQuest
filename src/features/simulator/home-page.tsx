import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Play, Shuffle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { ErrorState } from '@/components/page/error-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Case } from '@/features/cases/types'
import { DIMENSION_LABELS } from '@/features/cases/types'
import { ClayFallback, ClayObjectCard } from '@/features/landing-3d'
import type { ClayObjectName } from '@/features/landing-3d'
import type { SessionRecord } from '@/features/session/repository'
import { useSessionStore } from '@/features/session/store'
import { useLocale } from '@/lib/i18n'
import { categoryOf, SEVERITY_BADGE, specialtyLabel } from './case-meta'
import { BAND_VARIANT } from './band'
import { summarize } from './progress'
import { useCases, useSessionResults } from './use-simulator-data'
import { useST } from './use-st'
import { HISTORY_PATH } from './links'

function greetingKey(hour: number) {
  return hour < 11 ? 'morning' : hour < 15 ? 'afternoon' : hour < 18 ? 'evening' : 'night'
}

export function HomePage() {
  const st = useST()
  const navigate = useNavigate()
  const [hour] = useState(() => new Date().getHours())
  const cases = useCases()
  const results = useSessionResults()
  const session = useSessionStore((s) => s.session)
  const active = session && session.status === 'active' ? session : null

  const quickStart = () => {
    const list = cases.data
    if (!list?.length) return
    const pick = list[Math.floor(Math.random() * list.length)]!
    void navigate({ to: '/app/kasus/$caseId', params: { caseId: pick.id } })
  }

  return (
    <PageBody wide>
      <PageHeader
        title={st(`home.greeting.${greetingKey(hour)}`)}
        description={st('home.lead')}
        actions={
          <Button size="lg" onClick={quickStart} disabled={!cases.data?.length} data-testid="quick-start">
            <Shuffle aria-hidden="true" />
            {st('home.quickStart')}
          </Button>
        }
      />

      {active && (
        <section aria-label={st('home.resume')} className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink-2 bg-surface p-4" data-testid="resume">
          <div className="flex flex-col gap-0.5">
            <p className="text-body-s font-semibold text-ink-1">{st('home.resume')}</p>
            <p className="text-body-s text-ink-2">{st('home.resumeBody', { mode: st(active.mode === 'er' ? 'mode.er' : 'mode.poli') })}</p>
          </div>
          <Button asChild>
            <Link to="/app/sesi/$sessionId" params={{ sessionId: active.id }}>
              <Play aria-hidden="true" />
              {st('home.resumeCta')}
            </Link>
          </Button>
        </section>
      )}

      {cases.isError ? (
        <ErrorState onRetry={() => void cases.refetch()} />
      ) : (
        <section aria-label={st('home.modes')} className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          <ModeCard mode="poli" object="stethoscope" tint="green" cases={cases.data} />
          <ModeCard mode="er" object="firstAid" tint="coral" cases={cases.data} />
        </section>
      )}

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <RecentResults records={results.data} loading={results.isPending} error={results.isError} onRetry={() => void results.refetch()} />
        <ProgressCard records={results.data} loading={results.isPending} onStart={quickStart} />
      </div>
    </PageBody>
  )
}

/** Static art first; the WebGL canvas only mounts on wide screens once the page is idle, so /app stays light. */
function ModeArt({ object, tint }: { object: ClayObjectName; tint: 'green' | 'coral' }) {
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) return
    const idle = 'requestIdleCallback' in window
    const id = idle ? window.requestIdleCallback(() => setLive(true), { timeout: 2000 }) : window.setTimeout(() => setLive(true), 600)
    return () => (idle ? window.cancelIdleCallback(id) : window.clearTimeout(id))
  }, [])
  const className = 'w-28 shrink-0 sm:w-32'
  if (live) return <ClayObjectCard object={object} tint={tint} className={className} />
  return (
    <div className={`${className} aspect-square overflow-hidden rounded-[var(--mq-radius-lg)]`} style={{ backgroundColor: `var(--mq-tint-${tint})` }}>
      <ClayFallback variant="card" object={object} className="size-full" />
    </div>
  )
}

function ModeCard({ mode, object, tint, cases }: { mode: 'poli' | 'er'; object: ClayObjectName; tint: 'green' | 'coral'; cases: Case[] | undefined }) {
  const st = useST()
  const list = cases?.filter((c) => c.mode === mode)
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5" data-testid={`mode-${mode}`}>
      <div className="flex items-start gap-4">
        <ModeArt object={object} tint={tint} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="font-display text-heading-card font-semibold text-ink-1">{st(`mode.${mode}`)}</h2>
          <p className="text-body-s text-ink-2">{st(`home.mode.${mode}`)}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5" aria-label={st(`home.cases.${mode}`)}>
        {list
          ? list.map((c) => (
              <li key={c.id}>
                <Link
                  to="/app/kasus/$caseId"
                  params={{ caseId: c.id }}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-sm border border-line px-3 py-2 transition-[background-color,transform] duration-100 hover:bg-panel active:scale-[.985]"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-body-s font-semibold text-ink-1">{c.title}</span>
                    <span className="flex items-center gap-1.5">
                      <Badge variant="category" category={categoryOf(c)}>
                        {specialtyLabel(c)}
                      </Badge>
                      <Badge variant={SEVERITY_BADGE[c.severity]}>{st(`severity.${c.severity}`)}</Badge>
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))
          : [0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
      </ul>
    </article>
  )
}

function RecentResults({ records, loading, error, onRetry }: { records: SessionRecord[] | undefined; loading: boolean; error: boolean; onRetry: () => void }) {
  const st = useST()
  const [locale] = useLocale()
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const rows = records?.flatMap((r) => r.evaluations.map((e) => ({ record: r, e }))).slice(0, 4)
  return (
    <section aria-label={st('home.recent')} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('home.recent')}</h2>
        <Link to={HISTORY_PATH} className="inline-flex text-body-s font-medium text-primary-hover pointer-coarse:min-h-11 pointer-coarse:items-center hover:underline">
          {st('home.seeHistory')}
        </Link>
      </div>
      {error ? (
        <ErrorState onRetry={onRetry} className="py-8" />
      ) : loading ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : rows && rows.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {rows.map(({ record, e }) => (
            <li key={`${record.id}-${e.caseId}`}>
              <Link
                to="/app/debrief/$sessionId"
                params={{ sessionId: record.id }}
                className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3 transition-[background-color,transform] duration-100 hover:bg-panel active:scale-[.985]"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-body-s font-semibold text-ink-1">{e.caseTitle}</span>
                  <span className="text-label text-ink-muted">
                    {st(`mode.${record.mode}`)} / {fmt.format(new Date(record.savedAt))}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-body-s font-semibold text-ink-1 tabular-nums">{e.percent}%</span>
                  <Badge variant={BAND_VARIANT[e.band]}>{st(`band.${e.band}`)}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-line-strong p-6 text-center text-body-s text-ink-2">{st('home.noResults')}</p>
      )}
    </section>
  )
}

function ProgressCard({ records, loading, onStart }: { records: SessionRecord[] | undefined; loading: boolean; onStart: () => void }) {
  const st = useST()
  const [locale] = useLocale()
  const summary = records ? summarize(records) : null
  const weakest = summary?.weakest ? DIMENSION_LABELS[summary.weakest] : null
  return (
    <section aria-label={st('home.progress')} className="flex flex-col gap-3">
      <h2 className="font-display text-heading-card font-semibold text-ink-1">{st('home.progress')}</h2>
      <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
        {loading || !summary ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-3">
              {(
                [
                  ['sessions', summary.sessions],
                  ['average', `${summary.averagePercent}%`],
                  ['empathy', summary.averageEmpathy],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <dd className="order-1 font-display text-heading-card font-bold text-ink-1 tabular-nums">{v}</dd>
                  <dt className="text-label text-ink-muted">{st(`home.stat.${k}`)}</dt>
                </div>
              ))}
            </dl>
            {weakest && (
              <div className="flex flex-col gap-2 border-t border-line pt-3">
                <p className="text-body-s text-ink-2">
                  {st('home.focus')} <strong className="text-ink-1">{locale === 'en' ? (weakest.en ?? weakest.id) : weakest.id}</strong>
                </p>
                <Button variant="secondary" onClick={onStart} className="self-start">
                  {st('home.focusCta')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
