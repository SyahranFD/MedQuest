import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, BookOpen, FlaskConical, Info, Play } from 'lucide-react'
import { useState } from 'react'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DIMENSIONS, DIMENSION_LABELS } from '@/features/cases/types'
import type { Case } from '@/features/cases/types'
import { citationFor } from '@/features/grading/guidelines'
import { useLocale } from '@/lib/i18n'
import { categoryOf, SEVERITY_BADGE, specialtyLabel } from './case-meta'
import { VitalsGrid } from './exam-panel'
import { startCaseSession } from './session-flow'
import { useCase } from './use-simulator-data'
import { useST } from './use-st'
import { CASES_PATH } from './links'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
}

export function BriefPage({ caseId }: { caseId: string }) {
  const q = useCase(caseId)
  if (q.isPending) return <BriefSkeleton />
  if (q.isError) {
    return (
      <PageBody>
        <ErrorState onRetry={() => void q.refetch()} />
      </PageBody>
    )
  }
  return q.data ? <Brief c={q.data} /> : null
}

function BriefSkeleton() {
  return (
    <PageBody aria-busy="true">
      <Skeleton className="mb-3 h-5 w-24" />
      <Skeleton className="mb-8 h-12 w-2/3" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </PageBody>
  )
}

function Brief({ c }: { c: Case }) {
  const st = useST()
  const [locale] = useLocale()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const isEr = c.mode === 'er'

  const start = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const session = await startCaseSession(c)
      await navigate({ to: '/app/sesi/$sessionId', params: { sessionId: session.id } })
    } catch {
      setFailed(true)
      setBusy(false)
    }
  }

  const counts = DIMENSIONS.map((d) => ({ d, n: c.rubric.criteria.filter((x) => x.dimension === d).length })).filter((x) => x.n > 0)
  const citations = c.guidelineIds.flatMap((id) => citationFor(id) ?? [])

  return (
    <PageBody>
      <Link to={CASES_PATH} className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-body-s font-medium text-ink-2 hover:text-ink-1">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {st('brief.back')}
      </Link>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="category" category={categoryOf(c)}>
              {specialtyLabel(c)}
            </Badge>
            <Badge variant="neutral">{st(`mode.${c.mode}`)}</Badge>
            <Badge variant="neutral">{st(`difficulty.${c.difficulty}`)}</Badge>
            <Badge variant={SEVERITY_BADGE[c.severity]}>{st(`severity.${c.severity}`)}</Badge>
          </div>
        }
        title={c.title}
        description={c.arrivalBlurb}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section aria-label={st('brief.complaint')} className="flex flex-col gap-2">
            <h2 className="text-label font-semibold text-ink-muted uppercase">{st('brief.complaint')}</h2>
            <blockquote className="rounded-md border border-line bg-surface p-4 font-display text-heading-card font-medium text-ink-1">
              &ldquo;{c.chiefComplaint}&rdquo;
            </blockquote>
          </section>

          <section aria-label={st('brief.objectives')} className="flex flex-col gap-2">
            <h2 className="text-label font-semibold text-ink-muted uppercase">{st('brief.objectives')}</h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body text-ink-2">
              {c.rubric.teachingPoints.slice(0, 4).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <section aria-label={st('brief.graded')} className="flex flex-col gap-3">
            <h2 className="text-label font-semibold text-ink-muted uppercase">{st('brief.graded')}</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {counts.map(({ d, n }) => (
                <li key={d} className="flex flex-col gap-0.5 rounded-sm border border-line bg-surface p-3">
                  <span className="text-body-s font-semibold text-ink-1">{locale === 'en' ? (DIMENSION_LABELS[d].en ?? DIMENSION_LABELS[d].id) : DIMENSION_LABELS[d].id}</span>
                  <span className="text-label text-ink-muted">{st('brief.criteria', { n })}</span>
                </li>
              ))}
            </ul>
            {citations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-label font-medium text-ink-muted">
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  {st('brief.sources')}
                </span>
                {citations.map((ct) => (
                  <Badge key={ct.id} variant="neutral">
                    {ct.issuer.split('(')[0]!.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          {isEr && (
            <section aria-label={st('brief.shift')} className="flex flex-col gap-2 rounded-md border border-line bg-panel p-4" data-testid="shift-mechanics">
              <h2 className="text-body-s font-semibold text-ink-1">{st('brief.shift')}</h2>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
                {(['m1', 'm2', 'm3', 'm4'] as const).map((k) => (
                  <li key={k}>{st(`brief.shift.${k}`)}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="order-first flex flex-col gap-4 lg:order-none">
          <section aria-label={st('brief.patient')} className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-full bg-tint-green font-display text-heading-card font-bold text-ink-1" aria-hidden="true">
                {initials(c.patient.name)}
              </span>
              <div className="flex flex-col">
                <p className="font-display text-heading-card font-semibold text-ink-1">{c.patient.name}</p>
                <p className="text-body-s text-ink-2">
                  {c.patient.age} {st('brief.years')}, {st(c.patient.gender === 'F' ? 'brief.female' : 'brief.male')}, {c.patient.occupation}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-label font-semibold text-ink-muted uppercase">{st('brief.vitals')}</h2>
              <VitalsGrid vitals={c.vitals} />
            </div>
          </section>

          <p className="flex items-start gap-2.5 rounded-md border border-line-strong p-3.5 text-body-s text-ink-2" data-testid="synthetic-notice">
            <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {st('brief.synthetic')}
          </p>

          {failed && <ErrorState className="py-6" description={st('brief.startFailed')} onRetry={() => void start()} />}
          <Button size="lg" className="w-full" onClick={() => void start()} disabled={busy} data-testid="start-case">
            <Play aria-hidden="true" />
            {busy ? st('brief.starting') : st(isEr ? 'brief.startEr' : 'brief.startPoli')}
          </Button>
          <p className="flex items-start gap-2 text-label text-ink-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {st('brief.keys')}
          </p>
        </aside>
      </div>
    </PageBody>
  )
}
