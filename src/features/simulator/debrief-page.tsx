import { Link } from '@tanstack/react-router'
import { History, RotateCcw, Stethoscope } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { DebriefView } from './debrief-view'
import { GradingSequence } from './grading-sequence'
import { clearFresh, isFresh, loadTraces } from './session-flow'
import { useSessionResult } from './use-simulator-data'
import { useST } from './use-st'
import { CASES_PATH, HISTORY_PATH } from './links'

export function DebriefPage({ sessionId }: { sessionId: string }) {
  const st = useST()
  const q = useSessionResult(sessionId)
  const [grading, setGrading] = useState(() => isFresh(sessionId))
  const [index, setIndex] = useState(0)
  const finish = useCallback(() => setGrading(false), [])

  useEffect(() => {
    clearFresh(sessionId)
  }, [sessionId])

  const traces = useMemo(() => loadTraces(sessionId), [sessionId])

  if (q.isPending) {
    return (
      <PageBody aria-busy="true">
        <Skeleton className="mb-6 h-12 w-1/2" />
        <Skeleton className="mb-4 h-32" />
        <Skeleton className="h-64" />
      </PageBody>
    )
  }
  if (q.isError) {
    return (
      <PageBody>
        <ErrorState onRetry={() => void q.refetch()} />
      </PageBody>
    )
  }
  const record = q.data
  if (!record || record.evaluations.length === 0) {
    return (
      <PageBody>
        <EmptyState
          title={st('debrief.missing.title')}
          description={st('debrief.missing.body')}
          action={
            <Button asChild>
              <Link to="/app">{st('debrief.missing.cta')}</Link>
            </Button>
          }
        />
      </PageBody>
    )
  }

  const evaluation = record.evaluations[Math.min(index, record.evaluations.length - 1)]!
  const caseId = evaluation.caseId

  return (
    <PageBody>
      <PageHeader title={st('debrief.title')} description={st(record.mode === 'er' ? 'debrief.leadEr' : 'debrief.leadPoli')} />
      {grading ? (
        <GradingSequence onDone={finish} />
      ) : (
        <div className="flex flex-col gap-6">
          {record.evaluations.length > 1 && (
            <div role="tablist" aria-label={st('debrief.patients')} className="flex flex-wrap gap-2">
              {record.evaluations.map((ev, i) => (
                <button
                  key={ev.caseId}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'min-h-11 rounded-full border px-4 text-body-s font-medium transition-[background-color,transform] duration-100 active:scale-[.985]',
                    i === index ? 'border-ink-1 bg-ink-1 text-primary-ink' : 'border-line-strong text-ink-2 hover:bg-panel',
                  )}
                >
                  {ev.caseTitle}
                </button>
              ))}
            </div>
          )}
          <DebriefView
            evaluation={evaluation}
            trace={traces?.[caseId] ?? null}
            actions={
              <>
                <Button asChild size="lg">
                  <Link to="/app/kasus/$caseId" params={{ caseId }}>
                    <RotateCcw aria-hidden="true" />
                    {st('debrief.retry')}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to={CASES_PATH}>
                    <Stethoscope aria-hidden="true" />
                    {st('debrief.other')}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link to={HISTORY_PATH}>
                    <History aria-hidden="true" />
                    {st('debrief.history')}
                  </Link>
                </Button>
              </>
            }
          />
        </div>
      )}
    </PageBody>
  )
}
