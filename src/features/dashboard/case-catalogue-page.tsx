import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_CASES } from '@/features/cases/data'
import type { Case } from '@/features/cases/types'
import { getGuideline } from '@/features/grading/guidelines'
import { useT } from '@/lib/i18n'
import { usePageTitle } from '@/lib/use-page-title'
import { addAssignment, listAssignments } from './assignments'
import { CategoryLabel, DifficultyMark, ModeLabel, SampleBadge } from './components/badges'
import { shortIssuer } from './format'
import type { CaseStats } from './types'
import { CLASS_META } from './mock-class'
import { useCaseStats } from './use-dashboard-data'
import { useDt } from './use-dt'

function CaseEntry({ kase, stats, assigned, onAssign }: { kase: Case; stats?: CaseStats; assigned: boolean; onAssign: () => void }) {
  const { dt } = useDt()
  return (
    <article className="flex flex-col gap-3 rounded-row px-2 py-4 transition-colors duration-100 hover:bg-hover sm:flex-row sm:items-start sm:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="text-body-s font-medium text-ink-1">{kase.title}</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CategoryLabel kase={kase} />
          <ModeLabel mode={kase.mode} />
          <DifficultyMark difficulty={kase.difficulty} />
          <span className="text-meta text-ink-3">{dt('library.minutes', { n: kase.mode === 'er' ? 15 : 10 })}</span>
        </p>
        <p className="text-meta text-ink-3">
          <span className="font-medium text-ink-2">{dt('library.complaint')}: </span>
          {kase.chiefComplaint}
        </p>
        <div className="flex flex-col gap-1.5 pt-1">
          <ul aria-label={dt('library.guidelines')} className="flex flex-wrap gap-1.5">
            {kase.guidelineIds.map((gid) => {
              const g = getGuideline(gid)
              return g ? (
                <li key={gid}>
                  <Badge variant="neutral" title={g.title}>
                    {shortIssuer(g.issuer)}
                    {g.year ? ` ${g.year}` : ''}
                    <span className="sr-only">{`: ${g.title}`}</span>
                  </Badge>
                </li>
              ) : null
            })}
          </ul>
          <p className="text-meta text-ink-3">{dt('library.verify')}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-6 sm:w-96 sm:justify-end">
        <div className="flex flex-col sm:items-end">
          <span
            role="meter"
            aria-label={dt('library.passRate')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats?.passRate ?? 0}
            className="text-title font-semibold text-ink-1 tabular-nums"
          >
            {stats ? `${stats.passRate}%` : '-'}
          </span>
          <span className="text-meta text-ink-3">{dt('library.passRate')}</span>
          {stats && <span className="text-meta text-ink-3">{dt('library.attempts', { n: stats.attempts, students: stats.studentsAttempted })}</span>}
        </div>
        <Button variant="secondary" size="sm" onClick={onAssign} disabled={assigned}>
          {assigned ? dt('library.assigned') : dt('library.assign')}
        </Button>
      </div>
    </article>
  )
}

/** /dosen/perpustakaan: read-only catalogue with class pass rate and a mock "assign to class". */
export function CaseCataloguePage() {
  const { dt } = useDt()
  const t = useT()
  const { data: stats, isPending, isError, refetch } = useCaseStats()
  const [pending, setPending] = useState<Case | null>(null)
  const [query, setQuery] = useState('')
  const [, refresh] = useState(0)
  const classAssigned = new Set(listAssignments().filter((a) => a.target === 'class').map((a) => a.caseId))
  usePageTitle(dt('library.title'))
  const needle = query.trim().toLowerCase()
  const shown = ALL_CASES.filter((c) => needle === '' || `${c.title} ${c.chiefComplaint}`.toLowerCase().includes(needle))

  const confirm = () => {
    if (!pending) return
    if (addAssignment('class', pending.id)) {
      toast.success(dt('library.assign.toast', { case: pending.title, className: CLASS_META.className }))
      refresh((n) => n + 1)
    } else toast.error(t('state.error.title'))
    setPending(null)
  }

  return (
    <PageBody wide className="flex flex-col gap-4">
      <PageHeader
        title={dt('library.title')}
        description={
          <>
            {dt('library.desc')}
            <SampleBadge />
          </>
        }
        className="pb-0"
        toolbar={
          <div className="relative w-full sm:w-72">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              type="search"
              aria-label={dt('library.search')}
              value={query}
              placeholder={dt('library.search')}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />
      {isError && <ErrorState title={dt('loadError')} description={dt('loadErrorBody')} onRetry={() => void refetch()} />}
      {isPending ? (
        <div aria-hidden="true" className="flex flex-col">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-6 px-2 py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-80" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-6 w-40 rounded-full" />
              </div>
              <Skeleton className="hidden h-12 w-64 sm:block" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Search}
          title={dt('library.empty.title')}
          description={dt('library.empty.body')}
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              {dt('library.reset')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-line-soft">
          {shown.map((c) => (
            <CaseEntry key={c.id} kase={c} stats={stats?.find((s) => s.caseId === c.id)} assigned={classAssigned.has(c.id)} onAssign={() => setPending(c)} />
          ))}
        </div>
      )}
      <p className="max-w-3xl text-meta text-ink-3">{dt('library.note')}</p>
      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dt('library.assign.title', { case: pending?.title ?? '' })}</DialogTitle>
            <DialogDescription>{dt('library.assign.desc', { className: CLASS_META.className, n: CLASS_META.studentCount })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPending(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirm}>{dt('library.assign')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageBody>
  )
}
