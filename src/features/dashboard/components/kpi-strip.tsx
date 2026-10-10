import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { CountUp } from '@/components/ui/count-up'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClassKpis } from '../types'
import { useDt } from '../use-dt'

function Delta({ now, prev }: { now: number; prev: number }) {
  const Icon = now > prev ? ArrowUp : now < prev ? ArrowDown : Minus
  return <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
}

interface KpiProps {
  label: string
  value: number
  suffix?: string
  sub: string
  trend?: { now: number; prev: number }
}

function Kpi({ label, value, suffix, sub, trend }: KpiProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-surface p-5">
      <dt className="text-body-s text-ink-2">{label}</dt>
      <dd className="flex flex-col gap-1.5">
        <CountUp to={value} suffix={suffix} className="font-display text-[2.5rem] leading-none font-bold tracking-tight text-ink-1 tabular-nums" />
        <span className="flex items-center gap-1 text-label text-ink-muted">
          {trend && <Delta {...trend} />}
          {sub}
        </span>
      </dd>
    </div>
  )
}

export function KpiStrip({ kpis }: { kpis: ClassKpis }) {
  const { dt } = useDt()
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
      <Kpi
        label={dt('kpi.active')}
        value={kpis.activeThisWeek}
        sub={dt('kpi.active.sub', { total: kpis.enrolled, prev: kpis.activePreviousWeek })}
        trend={{ now: kpis.activeThisWeek, prev: kpis.activePreviousWeek }}
      />
      <Kpi
        label={dt('kpi.score')}
        value={kpis.averagePercent}
        sub={dt('kpi.score.sub', { prev: kpis.averagePreviousWeek })}
        trend={{ now: kpis.averagePercent, prev: kpis.averagePreviousWeek }}
      />
      <Kpi
        label={dt('kpi.completion')}
        value={kpis.completionRate}
        suffix="%"
        sub={dt('kpi.completion.sub', { done: kpis.completedPairs, total: kpis.possiblePairs })}
      />
      <Kpi label={dt('kpi.empathy')} value={kpis.averageEmpathy} sub={dt('kpi.empathy.sub')} />
    </dl>
  )
}

export function KpiSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 bg-surface p-5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}
