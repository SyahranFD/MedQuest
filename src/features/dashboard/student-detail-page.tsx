import { Link } from '@tanstack/react-router'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { LineChart } from '@/components/charts/line-chart'
import { MeterBars } from '@/components/charts/meter-bars'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/ui/count-up'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import { usePageTitle } from '@/lib/use-page-title'
import { listAssignments } from './assignments'
import { AssignDialog } from './components/assign-dialog'
import { Avatar } from './components/avatar'
import { BandBadge, ModeBadge, SampleBadge, StatusBadge } from './components/badges'
import { Panel } from './components/panel'
import { recommendCase } from './recommendation'
import type { StudentDetail } from './types'
import { useClassOverview, useStudent } from './use-dashboard-data'
import { useDt } from './use-dt'

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 bg-surface p-4 last:col-span-2 sm:last:col-span-1">
      <dt className="text-label text-ink-muted">{label}</dt>
      <dd className="font-display text-heading-section font-bold tracking-tight text-ink-1 tabular-nums">{children}</dd>
    </div>
  )
}

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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar initials={student.initials} className="size-16 text-heading-card" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-display text-heading-page font-bold text-ink-1">{student.name}</h1>
            <p className="text-body-s text-ink-2">
              {dt('detail.nim', { nim: student.nim })}, {dt('detail.meta', { cohort: overview?.meta.cohort ?? '', className: overview?.meta.className ?? '' })}
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <StatusBadge status={student.status} />
              <SampleBadge />
            </p>
          </div>
        </div>
        <AssignDialog
          studentId={student.id}
          studentName={student.name}
          recommendedCaseId={reco?.caseId ?? fallbackCase.id}
          onAssigned={() => refresh((n) => n + 1)}
        />
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-5">
        <Stat label={dt('detail.stat.attempts')}>
          <CountUp to={student.attemptCount} />
        </Stat>
        <Stat label={dt('detail.stat.average')}>{student.averagePercent === null ? '-' : <CountUp to={student.averagePercent} />}</Stat>
        <Stat label={dt('detail.stat.progress')}>
          {student.casesCompleted}/{student.casesTotal}
        </Stat>
        <Stat label={dt('detail.stat.empathy')}>{student.averageEmpathy === null ? '-' : <CountUp to={student.averageEmpathy} />}</Stat>
        <Stat label={dt('detail.stat.last')}>
          <span className="text-heading-card">{daysAgo(student.daysSinceActive)}</span>
        </Stat>
      </dl>

      <section aria-labelledby="reco" className="flex gap-4 rounded-md border border-line bg-panel p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary text-primary-ink">
          <Lightbulb aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="reco" className="font-display text-heading-card font-semibold text-ink-1">
            {dt('detail.reco.title')}
          </h2>
          <p className="text-body text-ink-1">{recoText}</p>
          {student.status === 'inactive' && <p className="text-body-s text-ink-2">{dt('detail.reco.inactive', { days: student.daysSinceActive ?? 0 })}</p>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
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
          <ul className="flex flex-col divide-y divide-line">
            {perCase.map(({ c, list, last, best }) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-body-s font-semibold text-ink-1">{c.title}</p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-ink-muted">
                    <ModeBadge mode={c.mode} />
                    {list.length > 0 ? `${dt('detail.attempts.count', { n: list.length })}, ${dt('detail.attempts.best', { score: best })}` : ''}
                  </p>
                </div>
                {last ? (
                  <div className="flex flex-col items-end gap-1">
                    <BandBadge band={last.evaluation.band} />
                    <span className="text-label text-ink-muted tabular-nums">{dt('detail.attempts.last', { date: date(last.at) })}</span>
                  </div>
                ) : (
                  <Badge variant="neutral">{dt('detail.attempts.none')}</Badge>
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
          <p className="text-body-s text-ink-2">{dt('detail.empathy.empty')}</p>
        )}
      </Panel>

      {assigned.length > 0 && (
        <Panel title={dt('assign.active')}>
          <ul className="flex flex-col divide-y divide-line">
            {assigned.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <span className="text-body-s font-semibold text-ink-1">{ALL_CASES.find((c) => c.id === a.caseId)?.title ?? a.caseId}</span>
                <span className="text-label text-ink-muted">{dt('assign.since', { date: date(a.at) })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <p className="text-label text-ink-muted">{dt('sample.note')}</p>
    </div>
  )
}

/** /dosen/mahasiswa/$studentId */
export function StudentDetailPage({ studentId }: { studentId: string }) {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useStudent(studentId)
  usePageTitle(data?.name ?? dt('detail.crumb'))
  return (
    <PageBody wide className="flex flex-col gap-5">
      <Button asChild variant="link" className="w-fit">
        <Link to={'/dosen/mahasiswa' as '/'}>
          <ArrowLeft aria-hidden="true" />
          {dt('detail.back')}
        </Link>
      </Button>
      {isPending && (
        <div aria-hidden="true" className="flex flex-col gap-6">
          <Skeleton className="h-20 w-2/3" />
          <Skeleton className="h-24 w-full" />
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
