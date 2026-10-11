import { Link } from '@tanstack/react-router'
import { ArrowRight, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useClassOverview } from '../use-dashboard-data'
import { useDt } from '../use-dt'
import type { StudentSummary } from '../types'
import { StatusBadge } from './badges'
import { Avatar } from './avatar'
import { Panel, PanelError } from './panel'

function reasonText(s: StudentSummary, dt: ReturnType<typeof useDt>['dt']) {
  return s.reasons
    .map((r) => (r === 'inactive' ? dt('reason.inactive', { days: s.daysSinceActive ?? 0 }) : dt(`reason.${r}`)))
    .join('. ')
}

/** The dominant block of the overview: who needs the lecturer first. */
export function AttentionPanel() {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useClassOverview()
  return (
    <Panel
      variant="card"
      title={dt('attention.title')}
      description={data && data.attention.length > 0 ? dt('attention.count', { n: data.attention.length }) : dt('attention.desc')}
      aside={
        <Button asChild variant="secondary" size="sm">
          <Link to={'/dosen/mahasiswa' as '/'}>
            {dt('attention.all')}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      }
    >
      {isPending && (
        <div aria-hidden="true" className="flex flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex h-14 items-center gap-3 px-2">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3.5 w-56" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      )}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {data && data.attention.length === 0 && (
        <p className="flex items-center gap-2 py-4 text-body-s text-ink-3">
          <CircleCheck aria-hidden="true" size={16} strokeWidth={1.5} />
          {dt('attention.empty')}
        </p>
      )}
      {data && data.attention.length > 0 && (
        <ul className="-mx-2 flex flex-col">
          {data.attention.map((s) => (
            <li key={s.id}>
              <Link
                to={'/dosen/mahasiswa/$studentId' as '/'}
                params={{ studentId: s.id } as never}
                className="flex h-14 items-center gap-3 rounded-row px-2 transition-colors duration-100 hover:bg-hover"
              >
                <Avatar initials={s.initials} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-s font-medium text-ink-1">{s.name}</span>
                  <span className="truncate text-meta text-ink-3">{reasonText(s, dt)}</span>
                </span>
                <span className="w-8 shrink-0 text-right text-body-s text-ink-2 tabular-nums">{s.averagePercent ?? '-'}</span>
                <span className="flex w-28 shrink-0 justify-end">
                  <StatusBadge status={s.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
