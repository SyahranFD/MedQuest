import { Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageTitle } from '@/lib/use-page-title'
import { cn } from '@/lib/utils'
import { SampleBadge } from './components/badges'
import { StudentTable } from './components/student-table'
import {
  filterStudents,
  initialTableState,
  nextSort,
  PAGE_SIZE,
  pageCount,
  paginate,
  sortStudents,
  type ProgressBand,
  type TableState,
} from './student-table'
import type { StudentStatus } from './types'
import { useStudents } from './use-dashboard-data'
import { useDt } from './use-dt'

const STATUSES: readonly (StudentStatus | 'all')[] = ['all', 'attention', 'inactive', 'on-track']
const PROGRESS: readonly ProgressBand[] = ['all', 'low', 'mid', 'done']

function TableSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-px overflow-hidden rounded-md border border-line bg-line">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 bg-surface px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

/** /dosen/mahasiswa: searchable, sortable, filterable student table. */
export function StudentsPage() {
  const { dt } = useDt()
  const uid = useId()
  const { data, isPending, isError, refetch } = useStudents()
  const [state, setState] = useState<TableState>(initialTableState)
  usePageTitle(dt('students.title'))

  const patch = (next: Partial<TableState>) => setState((s) => ({ ...s, page: 1, ...next }))
  const filtered = useMemo(() => (data ? sortStudents(filterStudents(data, state), state.sortKey, state.sortDir) : []), [data, state])
  const pages = pageCount(filtered.length)
  const page = Math.min(state.page, pages)
  const rows = paginate(filtered, page)
  const dirty = state.query !== '' || state.status !== 'all' || state.progress !== 'all'
  const reset = () => setState((s) => ({ ...initialTableState, sortKey: s.sortKey, sortDir: s.sortDir }))

  return (
    <PageBody wide className="flex flex-col gap-5">
      <PageHeader eyebrow={<SampleBadge />} title={dt('students.title')} description={dt('students.desc', { n: data?.length ?? 36 })} className="pb-0" />

      <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-64">
          <Label htmlFor={`${uid}-q`}>{dt('students.search')}</Label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
            <Input
              id={`${uid}-q`}
              type="search"
              value={state.query}
              placeholder={dt('students.search.placeholder')}
              onChange={(e) => patch({ query: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span id={`${uid}-s`} className="text-body-s font-medium text-ink-1">
            {dt('students.filter.status')}
          </span>
          <div role="group" aria-labelledby={`${uid}-s`} className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={state.status === s}
                onClick={() => patch({ status: s })}
                className={cn(
                  'inline-flex h-11 items-center rounded-full border px-3.5 text-body-s font-medium transition-[background-color,color,border-color,transform] duration-100 ease-out active:scale-[.985] sm:h-9',
                  state.status === s ? 'border-ink-1 bg-ink-1 text-surface' : 'border-line-strong text-ink-1 hover:bg-panel',
                )}
              >
                {s === 'all' ? dt('students.status.all') : dt(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-52">
          <Label htmlFor={`${uid}-p`}>{dt('students.filter.progress')}</Label>
          <Select value={state.progress} onValueChange={(v) => patch({ progress: v as ProgressBand })}>
            <SelectTrigger id={`${uid}-p`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROGRESS.map((p) => (
                <SelectItem key={p} value={p}>
                  {dt(`students.progress.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {dirty && (
          <Button variant="ghost" onClick={reset}>
            {dt('students.reset')}
          </Button>
        )}
      </div>

      {isPending && <TableSkeleton />}
      {isError && <ErrorState title={dt('loadError')} description={dt('loadErrorBody')} onRetry={() => void refetch()} />}
      {data && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          title={dt('students.empty.title')}
          description={dt('students.empty.body')}
          action={
            <Button variant="secondary" onClick={reset}>
              {dt('students.reset')}
            </Button>
          }
        />
      )}
      {data && filtered.length > 0 && (
        <>
          <StudentTable rows={rows} sortKey={state.sortKey} sortDir={state.sortDir} onSort={(key) => setState((s) => ({ ...s, ...nextSort(s, key), page: 1 }))} />
          <div className="flex flex-wrap items-center justify-between gap-3 text-body-s text-ink-2">
            <p aria-live="polite">{dt('students.range', { from: (page - 1) * PAGE_SIZE + 1, to: (page - 1) * PAGE_SIZE + rows.length, total: filtered.length })}</p>
            {pages > 1 && (
              <nav aria-label={dt('students.page', { page, pages })} className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setState((s) => ({ ...s, page: page - 1 }))}>
                  {dt('students.prev')}
                </Button>
                <span className="px-1 tabular-nums">{dt('students.page', { page, pages })}</span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setState((s) => ({ ...s, page: page + 1 }))}>
                  {dt('students.next')}
                </Button>
              </nav>
            )}
          </div>
        </>
      )}
    </PageBody>
  )
}
