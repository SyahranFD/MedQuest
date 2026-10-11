import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { CountUp } from '@/components/ui/count-up'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { ClassKpis } from '../types'
import { useDt } from '../use-dt'

function Delta({ now, prev }: { now: number; prev: number }) {
  const Icon = now > prev ? ArrowUp : now < prev ? ArrowDown : Minus
  return <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.5} />
}

const rowClass = 'grid grid-cols-2 gap-x-6 gap-y-5 border-b border-line pb-6'

/** One quiet number: label above, neutral value, optional muted note. Never status-coloured. */
export function Stat({ label, note, children }: { label: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-meta text-ink-3">{label}</dt>
      <dd className="flex flex-col gap-1">
        <span className="font-display text-title font-semibold text-ink-1 tabular-nums">{children}</span>
        {note && <span className="flex items-center gap-1 text-meta text-ink-3">{note}</span>}
      </dd>
    </div>
  )
}

export function StatRow({ className, ...props }: ComponentProps<'dl'>) {
  return <dl className={cn(rowClass, className)} {...props} />
}

export function KpiStrip({ kpis }: { kpis: ClassKpis }) {
  const { dt } = useDt()
  return (
    <StatRow className="lg:grid-cols-4">
      <Stat
        label={dt('kpi.active')}
        note={
          <>
            <Delta now={kpis.activeThisWeek} prev={kpis.activePreviousWeek} />
            {dt('kpi.active.sub', { total: kpis.enrolled, prev: kpis.activePreviousWeek })}
          </>
        }
      >
        <CountUp to={kpis.activeThisWeek} />
      </Stat>
      <Stat
        label={dt('kpi.score')}
        note={
          <>
            <Delta now={kpis.averagePercent} prev={kpis.averagePreviousWeek} />
            {dt('kpi.score.sub', { prev: kpis.averagePreviousWeek })}
          </>
        }
      >
        <CountUp to={kpis.averagePercent} />
      </Stat>
      <Stat label={dt('kpi.completion')} note={dt('kpi.completion.sub', { done: kpis.completedPairs, total: kpis.possiblePairs })}>
        <CountUp to={kpis.completionRate} suffix="%" />
      </Stat>
      <Stat label={dt('kpi.empathy')} note={dt('kpi.empathy.sub')}>
        <CountUp to={kpis.averageEmpathy} />
      </Stat>
    </StatRow>
  )
}

export function KpiSkeleton() {
  return (
    <div aria-hidden="true" className={cn(rowClass, 'lg:grid-cols-4')}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1">
          <Skeleton className="h-[1.125rem] w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[1.125rem] w-2/3" />
        </div>
      ))}
    </div>
  )
}
