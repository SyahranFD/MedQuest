import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, FlaskConical, Play } from 'lucide-react'
import { useState } from 'react'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DIMENSIONS, DIMENSION_LABELS } from '@/features/cases/types'
import type { Case } from '@/features/cases/types'
import { citationFor } from '@/features/grading/guidelines'
import { useLocale } from '@/lib/i18n'
import { specialtyLabel } from './case-meta'
import { startCaseSession } from './session-flow'
import { useCase } from './use-simulator-data'
import { useST } from './use-st'
import { VitalsGrid } from './vitals-grid'
import { CASES_PATH } from './links'

const SECTION_TITLE = 'font-display text-section font-semibold text-ink-1'

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
    <PageBody aria-busy="true" className="flex flex-col gap-6">
      <Skeleton className="h-5 w-24" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
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
  const sources = [...new Set(c.guidelineIds.flatMap((id) => citationFor(id) ?? []).map((ct) => ct.issuer.split('(')[0]!.trim()))]

  return (
    <PageBody className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link to={CASES_PATH} className="-ml-1 inline-flex w-fit items-center gap-1.5 rounded-row px-1 text-body-s font-medium text-ink-3 hover:text-ink-1 pointer-coarse:min-h-11">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {st('brief.back')}
        </Link>
        <PageHeader
          className="pb-0"
          title={c.title}
          description={c.arrivalBlurb}
          toolbar={
            <div className="flex w-full flex-col items-start gap-4">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-3">
                <span>{specialtyLabel(c)}</span>
                <span aria-hidden="true">/</span>
                <span>{st(`mode.${c.mode}`)}</span>
                <span aria-hidden="true">/</span>
                <span>{st(`difficulty.${c.difficulty}`)}</span>
              </p>
              <Button onClick={() => void start()} disabled={busy} data-testid="start-case">
                <Play aria-hidden="true" />
                {busy ? st('brief.starting') : st(isEr ? 'brief.startEr' : 'brief.startPoli')}
              </Button>
            </div>
          }
        />
        {failed && <ErrorState className="py-6" description={st('brief.startFailed')} onRetry={() => void start()} />}
      </div>

      <section aria-label={st('brief.patient')} className="flex flex-col gap-3">
        <h2 className={SECTION_TITLE}>{st('brief.patient')}</h2>
        <div className="flex flex-col gap-1">
          <p className="text-body-s font-medium text-ink-1">
            {c.patient.name}
            <span className="font-normal text-ink-3">
              {' '}
              / {c.patient.age} {st('brief.years')}, {st(c.patient.gender === 'F' ? 'brief.female' : 'brief.male')}, {c.patient.occupation}
            </span>
          </p>
          <blockquote className="font-display text-section font-medium text-ink-1">&ldquo;{c.chiefComplaint}&rdquo;</blockquote>
        </div>
      </section>

      <section aria-label={st('brief.vitals')} className="flex flex-col gap-3">
        <h2 className={SECTION_TITLE}>{st('brief.vitals')}</h2>
        <VitalsGrid vitals={c.vitals} />
      </section>

      <section aria-label={st('brief.objectives')} className="flex flex-col gap-3">
        <h2 className={SECTION_TITLE}>{st('brief.objectives')}</h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
          {c.rubric.teachingPoints.slice(0, 4).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section aria-label={st('brief.graded')} className="flex flex-col gap-3">
        <h2 className={SECTION_TITLE}>{st('brief.graded')}</h2>
        <ul className="flex flex-col border-t border-line-soft">
          {counts.map(({ d, n }) => (
            <li key={d} className="flex h-10 items-center justify-between gap-3 border-b border-line-soft text-body-s">
              <span className="text-ink-1">{locale === 'en' ? (DIMENSION_LABELS[d].en ?? DIMENSION_LABELS[d].id) : DIMENSION_LABELS[d].id}</span>
              <span className="text-meta text-ink-3">{st('brief.criteria', { n })}</span>
            </li>
          ))}
        </ul>
        {sources.length > 0 && (
          <p className="text-meta text-ink-3">
            {st('brief.sources')}: {sources.join(', ')}
          </p>
        )}
      </section>

      {isEr && (
        <section aria-label={st('brief.shift')} className="flex flex-col gap-3" data-testid="shift-mechanics">
          <h2 className={SECTION_TITLE}>{st('brief.shift')}</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-ink-2">
            {(['m1', 'm2', 'm3', 'm4'] as const).map((k) => (
              <li key={k}>{st(`brief.shift.${k}`)}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2 border-t border-line-soft pt-4">
        <p className="flex items-start gap-2 text-meta text-ink-3" data-testid="synthetic-notice">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {st('brief.synthetic')}
        </p>
        <p className="text-meta text-ink-3">{st('brief.keys')}</p>
      </div>
    </PageBody>
  )
}
