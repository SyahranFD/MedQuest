import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
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
    .join(', ')
}

export function AttentionPanel() {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useClassOverview()
  return (
    <Panel
      title={dt('attention.title')}
      description={dt('attention.desc')}
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
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {data && data.attention.length === 0 && <p className="text-body-s text-ink-2">{dt('attention.empty')}</p>}
      {data && data.attention.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {data.attention.map((s) => (
            <li key={s.id}>
              <Link
                to={'/dosen/mahasiswa/$studentId' as '/'}
                params={{ studentId: s.id } as never}
                className="-mx-2 flex min-h-14 items-center gap-3 rounded-sm px-2 py-2.5 transition-colors duration-100 hover:bg-panel"
              >
                <Avatar initials={s.initials} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-s font-semibold text-ink-1">{s.name}</span>
                  <span className="truncate text-label text-ink-muted">{reasonText(s, dt)}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={s.status} />
                  <span className="text-label text-ink-2 tabular-nums">{s.averagePercent ?? '-'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
