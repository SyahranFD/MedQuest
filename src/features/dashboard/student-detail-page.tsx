import { Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { LineChart } from '@/components/charts/line-chart'
import { MeterBars } from '@/components/charts/meter-bars'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { CountUp } from '@/components/ui/count-up'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import { usePageTitle } from '@/lib/use-page-title'
import { listAssignments } from './assignments'
import { AssignDialog } from './components/assign-dialog'
import { BandBadge, ModeLabel, SampleBadge, StatusBadge } from './components/badges'
import { Stat, StatRow } from './components/kpi-strip'
import { Panel } from './components/panel'
import { recommendCase } from './recommendation'
import type { StudentDetail } from './types'
import { useClassOverview, useStudent } from './use-dashboard-data'
import { useDt } from './use-dt'

function Body({ student }: { student: StudentDetail }) {
  const { dt, dimension, date, daysAgo } = useDt()
  const { data: overview } = useClassOverview()
  const [, refresh] = useState(0)
  const assigned = listAssignments().filter((a) => a.target === student.id)
  const reco = overview ? recommendCase(student, student.attempts, overview.dimensionAverages) : null
  const recoCase = reco ? ALL_CASES.find((c) => c.id === reco.caseId) : ALL_CASES[0]
  const fallbackCase = ALL_CASES.find((c) => !student.attempts.some((a) => a.caseId === c.id)) ?? ALL_CASES[0]!

  const recoText = (() => {
    if (!reco || !recoCase) return dt('detail.reco.empty', { name: student.name, case: fallbackCase.title })
    const vars = { name: student.name, dim: dimension(reco.dimension), score: reco.score, gap: Math.abs(reco.gap), case: recoCase.title, focus: dt(`focus.${reco.dimension}`) }
    return reco.gap < 0 ? dt('detail.reco.below', vars) : dt('detail.reco.near', vars)
  })()

  const perCase = ALL_CASES.map((c) => {
    const list = student.attempts.filter((a) => a.caseId === c.id)
    const last = list[list.length - 1]
    return { c, list, last, best: list.reduce((m, a) => Math.max(m, a.evaluation.percent), 0) }
  })

  const attemptLabels = student.attempts.map((_, i) => String(i + 1))
  const attemptTitles = student.attempts.map((a, i) => `${dt('detail.attempt', { n: i + 1 })}, ${date(a.at)}`)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={student.name}
        description={
          <>
            {dt('detail.nim', { nim: student.nim })}, {dt('detail.meta', { cohort: overview?.meta.cohort ?? '', className: overview?.meta.className ?? '' })}
            <span className="ml-2 inline-flex items-center gap-1.5 align-middle">
              <StatusBadge status={student.status} />
              <SampleBadge />
            </span>
          </>
        }
        actions={
          <AssignDialog
            studentId={student.id}
            studentName={student.name}
            recommendedCaseId={reco?.caseId ?? fallbackCase.id}
            onAssigned={() => refresh((n) => n + 1)}
          />
        }
        className="pb-0"
      />

      <StatRow className="sm:grid-cols-5">
        <Stat label={dt('detail.stat.attempts')}>
          <CountUp to={student.attemptCount} />
        </Stat>
        <Stat label={dt('detail.stat.average')}>{student.averagePercent === null ? '-' : <CountUp to={student.averagePercent} />}</Stat>
        <Stat label={dt('detail.stat.progress')}>
          {student.casesCompleted}/{student.casesTotal}
        </Stat>
        <Stat label={dt('detail.stat.empathy')}>{student.averageEmpathy === null ? '-' : <CountUp to={student.averageEmpathy} />}</Stat>
        <Stat label={dt('detail.stat.last')}>{daysAgo(student.daysSinceActive)}</Stat>
      </StatRow>

      <Panel variant="card" title={dt('detail.reco.title')}>
        <div className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-row bg-hover text-ink-2">
            <Lightbulb aria-hidden="true" size={16} strokeWidth={1.5} />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body-s text-ink-1">{recoText}</p>
            {student.status === 'inactive' && <p className="text-meta text-ink-3">{dt('detail.reco.inactive', { days: student.daysSinceActive ?? 0 })}</p>}
          </div>
        </div>
      </Panel>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <Panel title={dt('detail.dims.title')} description={dt('detail.dims.desc')}>
          {student.dimensionAverages && overview ? (
            <MeterBars
              rows={DIMENSIONS.map((d) => ({ key: d, label: dimension(d), value: student.dimensionAverages![d], compare: overview.dimensionAverages[d] }))}
              describe={(row) => dt('detail.dims.aria', { dim: row.label, value: Math.round(row.value), avg: Math.round(row.compare ?? 0) })}
              compareLabel={dt('detail.dims.compare')}
            />
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </Panel>

        <Panel title={dt('detail.attempts.title')}>
          <ul className="-mx-2 flex flex-col">
            {perCase.map(({ c, list, last, best }) => (
              <li key={c.id} className="flex min-h-14 items-center justify-between gap-x-4 rounded-row px-2 py-2 hover:bg-hover">
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-body-s font-medium text-ink-1">{c.title}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-meta text-ink-3">
                    <ModeLabel mode={c.mode} />
                    {list.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        {dt('detail.attempts.count', { n: list.length })}, {dt('detail.attempts.best', { score: best })}
                      </>
                    )}
                  </p>
                </div>
                {last ? (
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <BandBadge band={last.evaluation.band} />
                    <span className="text-meta text-ink-3 tabular-nums">{dt('detail.attempts.last', { date: date(last.at) })}</span>
                  </div>
                ) : (
                  <span className="text-meta text-ink-3">{dt('detail.attempts.none')}</span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={dt('detail.empathy.title')} description={dt('detail.empathy.desc')}>
        {student.attempts.length >= 2 ? (
          <LineChart
            label={dt('detail.empathy.label')}
            summary={dt('detail.empathy.summary', { n: student.attempts.length, first: date(student.attempts[0]!.at), last: date(student.attempts[student.attempts.length - 1]!.at) })}
            tableLabel={dt('chart.table')}
            xHeader={dt('detail.stat.attempts')}
            hint={dt('chart.hint')}
            xLabels={attemptLabels}
            xTitles={attemptTitles}
            series={[
              { id: 'score', label: dt('trend.score'), values: student.attempts.map((a) => a.evaluation.percent), tone: 'primary' },
              { id: 'empathy', label: dt('trend.empathy'), values: student.attempts.map((a) => a.evaluation.empathyScore), tone: 'ink' },
            ]}
          />
        ) : (
          <p className="text-body-s text-ink-3">{dt('detail.empathy.empty')}</p>
        )}
      </Panel>

      {assigned.length > 0 && (
        <Panel title={dt('assign.active')}>
          <ul className="-mx-2 flex flex-col">
            {assigned.map((a) => (
              <li key={a.id} className="flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-row px-2 hover:bg-hover">
                <span className="text-body-s font-medium text-ink-1">{ALL_CASES.find((c) => c.id === a.caseId)?.title ?? a.caseId}</span>
                <span className="text-meta text-ink-3">{dt('assign.since', { date: date(a.at) })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <p className="text-meta text-ink-3">{dt('sample.note')}</p>
    </div>
  )
}

/** /dosen/mahasiswa/$studentId */
export function StudentDetailPage({ studentId }: { studentId: string }) {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useStudent(studentId)
  usePageTitle(data?.name ?? dt('detail.crumb'))
  return (
    <PageBody wide className="flex flex-col gap-4">
      {isPending && (
        <div aria-hidden="true" className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[1.3125rem] w-80" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {isError && <ErrorState title={dt('loadError')} description={dt('loadErrorBody')} onRetry={() => void refetch()} />}
      {!isPending && !isError && !data && (
        <>
          <h1 className="sr-only">{dt('detail.notFound')}</h1>
          <EmptyState title={dt('detail.notFound')} description={dt('detail.notFound.body')} />
        </>
      )}
      {data && <Body student={data} />}
    </PageBody>
  )
}
