import { Link, useNavigate } from '@tanstack/react-router'
import { ClipboardList, HeartHandshake, Play, Shuffle, Siren, Stethoscope, Target, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CaseFolderGrid, CaseFolderSkeleton } from '@/features/cases/components/case-folder'
import type { Case } from '@/features/cases/types'
import type { SessionRecord } from '@/features/session/repository'
import { useSessionStore } from '@/features/session/store'
import { useLocale } from '@/lib/i18n'
import { BAND_VARIANT } from './band'
import { summarize } from './progress'
import { useCases, useSessionResults } from './use-simulator-data'
import { useST } from './use-st'
import { CASES_PATH, HISTORY_PATH } from './links'

function greetingKey(hour: number) {
  return hour < 11 ? 'morning' : hour < 15 ? 'afternoon' : hour < 18 ? 'evening' : 'night'
}

const SECTION_TITLE = 'font-display text-section font-semibold text-ink-1'

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
    <PageBody wide className="flex flex-col gap-8">
      <PageHeader
        className="pb-0"
        title={st(`home.greeting.${greetingKey(hour)}`)}
        description={active ? st('home.resumeBody', { mode: st(active.mode === 'er' ? 'mode.er' : 'mode.poli') }) : st('home.lead')}
        actions={
          <>
            {active && (
              <Button asChild data-testid="resume">
                <Link to="/app/sesi/$sessionId" params={{ sessionId: active.id }}>
                  <Play aria-hidden="true" />
                  {st('home.resumeCta')}
                </Link>
              </Button>
            )}
            <Button variant={active ? 'secondary' : 'primary'} onClick={quickStart} disabled={!cases.data?.length} data-testid="quick-start">
              <Shuffle aria-hidden="true" />
              {st('home.quickStart')}
            </Button>
          </>
        }
      />

      <ProgressStrip records={results.data} loading={results.isPending} />

      <section aria-label={st('home.modes')} className="flex flex-col gap-4">
        <h2 className={SECTION_TITLE}>{st('home.modes')}</h2>
        {cases.isError ? (
          <ErrorState onRetry={() => void cases.refetch()} />
        ) : (
          <div className="flex flex-col gap-10">
            <ModeGroup mode="poli" icon={Stethoscope} cases={cases.data} />
            <ModeGroup mode="er" icon={Siren} cases={cases.data} />
          </div>
        )}
      </section>

      <RecentResults records={results.data} loading={results.isPending} error={results.isError} onRetry={() => void results.refetch()} />
    </PageBody>
  )
}

function ModeGroup({ mode, icon: Icon, cases }: { mode: 'poli' | 'er'; icon: LucideIcon; cases: Case[] | undefined }) {
  const st = useST()
  const list = cases?.filter((c) => c.mode === mode)
  return (
    <article className="flex flex-col gap-4" data-testid={`mode-${mode}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-row bg-hover text-ink-2">
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className={SECTION_TITLE}>{st(`mode.${mode}`)}</h3>
          <p className="text-body-s text-ink-3">{st(`home.mode.${mode}`)}</p>
        </div>
      </div>
      {list ? <CaseFolderGrid cases={list} label={st(`home.cases.${mode}`)} /> : <CaseFolderSkeleton count={3} />}
    </article>
  )
}

function RecentResults({ records, loading, error, onRetry }: { records: SessionRecord[] | undefined; loading: boolean; error: boolean; onRetry: () => void }) {
  const st = useST()
  const [locale] = useLocale()
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const rows = records?.flatMap((r) => r.evaluations.map((e) => ({ record: r, e }))).slice(0, 4)
  return (
    <section aria-label={st('home.recent')} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className={SECTION_TITLE}>{st('home.recent')}</h2>
        <Link to={HISTORY_PATH} className="inline-flex text-body-s font-medium text-ink-3 hover:text-ink-1 pointer-coarse:min-h-11 pointer-coarse:items-center">
          {st('home.seeHistory')}
        </Link>
      </div>
      {error ? (
        <ErrorState onRetry={onRetry} className="py-8" />
      ) : loading ? (
        <div className="flex flex-col gap-1" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows && rows.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line-soft">
          {rows.map(({ record, e }) => (
            <li key={`${record.id}-${e.caseId}`}>
              <Link
                to="/app/debrief/$sessionId"
                params={{ sessionId: record.id }}
                className="flex h-14 items-center justify-between gap-3 rounded-row px-2 transition-[background-color] duration-100 hover:bg-hover"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body-s font-medium text-ink-1">{e.caseTitle}</span>
                  <span className="text-meta text-ink-3">
                    {st(`mode.${record.mode}`)} / {fmt.format(new Date(record.savedAt))}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Badge variant={BAND_VARIANT[e.band]} className="hidden sm:inline-flex">
                    {st(`band.${e.band}`)}
                  </Badge>
                  <span className="text-body-s font-medium text-ink-1 tabular-nums">{e.percent}%</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={st('home.noResultsTitle')}
          description={st('home.noResults')}
          action={
            <Button asChild variant="secondary">
              <Link to={CASES_PATH}>{st('home.allCases')}</Link>
            </Button>
          }
        />
      )}
    </section>
  )
}

const STAT_ICONS = { sessions: ClipboardList, average: Target, empathy: HeartHandshake } as const
const STAT_TILES = { sessions: 'bg-chip-infection', average: 'bg-chip-endocrine', empathy: 'bg-chip-cardio' } as const

function ProgressStrip({ records, loading }: { records: SessionRecord[] | undefined; loading: boolean }) {
  const st = useST()
  if (loading) return <Skeleton className="h-28 w-full" />
  const summary = records ? summarize(records) : null
  if (!summary || summary.sessions === 0) return null
  return (
    <section aria-label={st('home.progress')}>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(
          [
            ['sessions', summary.sessions],
            ['average', `${summary.averagePercent}%`],
            ['empathy', summary.averageEmpathy],
          ] as const
        ).map(([k, v]) => {
          const Icon = STAT_ICONS[k]
          return (
            <div key={k} data-testid="stat-card" className="flex flex-col gap-3 rounded-card border border-line bg-raised p-5">
              <dt className="flex items-center gap-3 text-body-s font-medium text-ink-2">
                <span className={`grid size-9 place-items-center rounded-lg text-ink-1 ${STAT_TILES[k]}`}>
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {st(`home.stat.${k}`)}
              </dt>
              <dd className="font-display text-[2rem] leading-none font-semibold tracking-tight text-ink-1 tabular-nums">{v}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
