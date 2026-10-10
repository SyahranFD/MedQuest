import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_CASES } from '@/features/cases/data'
import type { Case } from '@/features/cases/types'
import { getGuideline } from '@/features/grading/guidelines'
import { useT } from '@/lib/i18n'
import { usePageTitle } from '@/lib/use-page-title'
import { addAssignment, listAssignments } from './assignments'
import { CategoryBadge, DifficultyMark, ModeBadge, SampleBadge } from './components/badges'
import { shortIssuer } from './format'
import type { CaseStats } from './types'
import { CLASS_META } from './mock-class'
import { useCaseStats } from './use-dashboard-data'
import { useDt } from './use-dt'

function CaseEntry({ kase, stats, assigned, onAssign }: { kase: Case; stats?: CaseStats; assigned: boolean; onAssign: () => void }) {
  const { dt } = useDt()
  return (
    <article className="flex flex-col gap-4 rounded-md border border-line bg-surface p-5">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge kase={kase} />
          <ModeBadge mode={kase.mode} />
          <DifficultyMark difficulty={kase.difficulty} />
        </div>
        <h2 className="font-display text-heading-card font-semibold text-ink-1">{kase.title}</h2>
        <p className="text-body-s text-ink-2">
          <span className="font-medium text-ink-1">{dt('library.complaint')}: </span>
          {kase.chiefComplaint}
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3 text-body-s">
          <span className="text-ink-2">{dt('library.passRate')}</span>
          <span className="font-semibold text-ink-1 tabular-nums">{stats ? `${stats.passRate}%` : '-'}</span>
        </div>
        <div role="meter" aria-label={dt('library.passRate')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats?.passRate ?? 0} className="h-2 rounded-full bg-inset">
          <div className="h-full rounded-full bg-primary" style={{ width: `${stats?.passRate ?? 0}%` }} />
        </div>
        {stats && <p className="text-label text-ink-muted">{dt('library.attempts', { n: stats.attempts, students: stats.studentsAttempted })}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-label font-semibold text-ink-2 uppercase">{dt('library.guidelines')}</p>
        <ul className="flex flex-col gap-1.5">
          {kase.guidelineIds.map((gid) => {
            const g = getGuideline(gid)
            return g ? (
              <li key={gid} className="flex items-start gap-2 text-body-s text-ink-2">
                <Badge variant="neutral" className="mt-0.5">
                  {shortIssuer(g.issuer)}
                  {g.year ? ` ${g.year}` : ''}
                </Badge>
                <span className="min-w-0">{g.title}</span>
              </li>
            ) : null
          })}
        </ul>
        <p className="text-label text-ink-muted">{dt('library.verify')}</p>
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-label text-ink-muted">
          {dt('library.minutes', { n: kase.mode === 'er' ? 15 : 10 })}
        </span>
        <Button variant={assigned ? 'secondary' : 'primary'} size="sm" onClick={onAssign} disabled={assigned}>
          {assigned ? dt('library.assigned') : dt('library.assign')}
        </Button>
      </footer>
    </article>
  )
}

/** /dosen/perpustakaan: read-only catalogue with class pass rate and a mock "assign to class". */
export function CaseCataloguePage() {
  const { dt } = useDt()
  const t = useT()
  const { data: stats, isPending, isError, refetch } = useCaseStats()
  const [pending, setPending] = useState<Case | null>(null)
  const [, refresh] = useState(0)
  const classAssigned = new Set(listAssignments().filter((a) => a.target === 'class').map((a) => a.caseId))
  usePageTitle(dt('library.title'))

  const confirm = () => {
    if (!pending) return
    if (addAssignment('class', pending.id)) {
      toast.success(dt('library.assign.toast', { case: pending.title, className: CLASS_META.className }))
      refresh((n) => n + 1)
    } else toast.error(t('state.error.title'))
    setPending(null)
  }

  return (
    <PageBody wide className="flex flex-col gap-5">
      <PageHeader eyebrow={<SampleBadge />} title={dt('library.title')} description={dt('library.desc')} className="pb-0" />
      <p className="max-w-3xl rounded-sm border border-line bg-panel px-4 py-3 text-body-s text-ink-2">{dt('library.note')}</p>
      {isError && <ErrorState title={dt('loadError')} description={dt('loadErrorBody')} onRetry={() => void refetch()} />}
      {isPending ? (
        <div aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {ALL_CASES.map((c) => (
            <CaseEntry key={c.id} kase={c} stats={stats?.find((s) => s.caseId === c.id)} assigned={classAssigned.has(c.id)} onAssign={() => setPending(c)} />
          ))}
        </div>
      )}
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
