import { Link } from '@tanstack/react-router'
import { History, RotateCcw, Stethoscope } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
      <PageBody aria-busy="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-3.5 w-40" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex flex-col">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="my-3 h-8 w-full" />
          ))}
        </div>
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
            <Tabs value={String(index)} onValueChange={(v) => setIndex(Number(v))} variant="underline">
              <TabsList aria-label={st('debrief.patients')} className="overflow-x-auto">
                {record.evaluations.map((ev, i) => (
                  <TabsTrigger key={ev.caseId} value={String(i)}>
                    {ev.caseTitle}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          <DebriefView
            evaluation={evaluation}
            trace={traces?.[caseId] ?? null}
            actions={
              <>
                <Button asChild>
                  <Link to={CASES_PATH}>
                    <Stethoscope aria-hidden="true" />
                    {st('debrief.other')}
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/app/kasus/$caseId" params={{ caseId }}>
                    <RotateCcw aria-hidden="true" />
                    {st('debrief.retry')}
                  </Link>
                </Button>
                <Button asChild variant="ghost">
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
