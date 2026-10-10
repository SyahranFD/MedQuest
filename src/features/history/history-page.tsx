import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, History as HistoryIcon, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { LineChart } from '@/components/charts/line-chart'
import { MeterBars } from '@/components/charts/meter-bars'
import { EmptyState } from '@/components/page/empty-state'
import { ErrorState } from '@/components/page/error-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CountUp } from '@/components/ui/count-up'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import { clearSessionResults, listSessionResults } from '@/features/session/repository'
import { useT } from '@/lib/i18n'
import { usePageTitle } from '@/lib/use-page-title'
import { cn } from '@/lib/utils'
import { HistoryDetail, RatingBadge } from './history-detail'
import { historyKeys } from './keys'
import { defaultFilters, filterRows, personalStats, toRows, type HistoryFilters, type HistoryRow, type HistorySort, type RatingFilter } from './stats'
import { useHt } from './use-ht'

const SORTS: readonly HistorySort[] = ['newest', 'oldest', 'high', 'low']
const RATINGS: readonly RatingFilter[] = ['all', 'passed', 'retry']

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center rounded-full border px-3.5 text-body-s font-medium transition-[background-color,color,border-color,transform] duration-100 ease-out active:scale-[.985] sm:h-9',
        pressed ? 'border-ink-1 bg-ink-1 text-surface' : 'border-line-strong text-ink-1 hover:bg-panel',
      )}
    >
      {children}
    </button>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4 rounded-md border border-line bg-surface p-5">
      <header className="flex flex-col gap-1">
        <h2 id={id} className="font-display text-heading-card font-semibold text-ink-1">
          {title}
        </h2>
        {description && <p className="text-body-s text-ink-2">{description}</p>}
      </header>
      {children}
    </section>
  )
}

function ResetButton() {
  const { ht } = useHt()
  const t = useT()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const reset = useMutation({
    mutationFn: clearSessionResults,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: historyKeys.sessions })
      setOpen(false)
      toast.success(ht('reset.done'))
    },
  })
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {ht('reset')}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ht('reset.title')}</DialogTitle>
          <DialogDescription>{ht('reset.body')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={() => reset.mutate()} disabled={reset.isPending}>
            {ht('reset.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ row, onOpen }: { row: HistoryRow; onOpen: () => void }) {
  const { ht, dateTime } = useHt()
  const e = row.evaluation
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={ht('row', { title: e.caseTitle })}
        className="grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-sm px-3 py-3 text-left transition-[background-color,transform] duration-100 ease-out hover:bg-panel active:scale-[.995]"
      >
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-body-s font-semibold text-ink-1">{e.caseTitle}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-ink-muted">
            <Badge variant="neutral">{ht(`mode.${row.mode}`)}</Badge>
            {dateTime(row.savedAt)}
            {row.demo && <Badge variant="neutral">{ht('demo')}</Badge>}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span className="flex flex-col items-end gap-1">
            <span className="font-display text-heading-card font-semibold text-ink-1 tabular-nums">{e.percent}</span>
            <RatingBadge band={e.band} />
          </span>
          <ChevronRight aria-hidden="true" className="size-4 text-ink-4" />
        </span>
      </button>
    </li>
  )
}

/** /app/riwayat: personal stats, filters and the list of graded cases. */
export function HistoryPage() {
  const { ht, dimension, shortDate } = useHt()
  const uid = useId()
  const { data, isPending, isError, refetch } = useQuery({ queryKey: historyKeys.sessions, queryFn: listSessionResults })
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters)
  const [open, setOpen] = useState<HistoryRow | null>(null)
  usePageTitle(ht('title'))

  const rows = useMemo(() => toRows(data ?? []), [data])
  const shown = useMemo(() => filterRows(rows, filters), [rows, filters])
  const stats = useMemo(() => personalStats(data ?? []), [data])
  const chronological = useMemo(() => rows.slice().sort((a, b) => a.savedAt.localeCompare(b.savedAt)), [rows])
  const set = (patch: Partial<HistoryFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const dirty = filters.mode !== 'all' || filters.rating !== 'all' || filters.caseId !== 'all'

  return (
    <PageBody wide className="flex flex-col gap-6">
      <PageHeader title={ht('title')} description={ht('desc')} actions={<ResetButton />} className="pb-0" />

      {isPending && (
        <div aria-hidden="true" className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}
      {isError && <ErrorState title={ht('loadError')} description={ht('loadErrorBody')} onRetry={() => void refetch()} />}

      {data && rows.length === 0 && (
        <EmptyState
          icon={HistoryIcon}
          title={ht('empty.title')}
          description={ht('empty.body')}
          action={
            <Button asChild>
              <Link to={'/app/kasus' as '/'}>{ht('empty.cta')}</Link>
            </Button>
          }
        />
      )}

      {data && rows.length > 0 && (
        <>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4">
            {[
              [ht('stat.sessions'), stats.sessions],
              [ht('stat.average'), stats.averagePercent ?? 0],
              [ht('stat.best'), stats.bestPercent ?? 0],
              [ht('stat.empathy'), stats.averageEmpathy ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-2 bg-surface p-5">
                <dt className="text-body-s text-ink-2">{label}</dt>
                <dd>
                  <CountUp to={value as number} className="font-display text-[2.25rem] leading-none font-bold tracking-tight text-ink-1 tabular-nums" />
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <Section title={ht('dims.title')} description={ht('dims.desc')}>
              {stats.dimensions && (
                <MeterBars
                  rows={DIMENSIONS.map((d) => ({ key: d, label: dimension(d), value: stats.dimensions![d] }))}
                  describe={(r) => ht('dims.aria', { dim: r.label, value: Math.round(r.value) })}
                />
              )}
            </Section>
            <Section title={ht('trend.title')} description={ht('trend.desc')}>
              {chronological.length >= 2 ? (
                <LineChart
                  label={ht('trend.label')}
                  summary={ht('trend.summary', { n: chronological.length, first: shortDate(chronological[0]!.savedAt), last: shortDate(chronological[chronological.length - 1]!.savedAt) })}
                  tableLabel={ht('chart.table')}
                  xHeader={ht('trend.axis')}
                  hint={ht('chart.hint')}
                  xLabels={chronological.map((_, i) => String(i + 1))}
                  xTitles={chronological.map((r, i) => `${i + 1}. ${r.evaluation.caseTitle}, ${shortDate(r.savedAt)}`)}
                  series={[
                    { id: 'score', label: ht('trend.score'), values: chronological.map((r) => r.evaluation.percent), tone: 'primary' },
                    { id: 'empathy', label: ht('trend.empathy'), values: chronological.map((r) => r.evaluation.empathyScore), tone: 'ink' },
                  ]}
                />
              ) : (
                <p className="text-body-s text-ink-2">{ht('trend.empty')}</p>
              )}
            </Section>
          </div>

          <section aria-label={ht('list')} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex flex-col gap-1.5">
                <span id={`${uid}-m`} className="text-body-s font-medium text-ink-1">
                  {ht('filter.mode')}
                </span>
                <div role="group" aria-labelledby={`${uid}-m`} className="flex flex-wrap gap-2">
                  {(['all', 'er', 'poli'] as const).map((m) => (
                    <Chip key={m} pressed={filters.mode === m} onClick={() => set({ mode: m })}>
                      {ht(`mode.${m}`)}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span id={`${uid}-r`} className="text-body-s font-medium text-ink-1">
                  {ht('filter.rating')}
                </span>
                <div role="group" aria-labelledby={`${uid}-r`} className="flex flex-wrap gap-2">
                  {RATINGS.map((r) => (
                    <Chip key={r} pressed={filters.rating === r} onClick={() => set({ rating: r })}>
                      {ht(`rating.${r}`)}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 sm:w-60">
                <Label htmlFor={`${uid}-c`}>{ht('filter.case')}</Label>
                <Select value={filters.caseId} onValueChange={(v) => set({ caseId: v })}>
                  <SelectTrigger id={`${uid}-c`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{ht('case.all')}</SelectItem>
                    {ALL_CASES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:w-44">
                <Label htmlFor={`${uid}-s`}>{ht('filter.sort')}</Label>
                <Select value={filters.sort} onValueChange={(v) => set({ sort: v as HistorySort })}>
                  <SelectTrigger id={`${uid}-s`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ht(`sort.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {dirty && (
                <Button variant="ghost" onClick={() => setFilters((f) => ({ ...defaultFilters, sort: f.sort }))}>
                  {ht('filter.reset')}
                </Button>
              )}
            </div>

            <p aria-live="polite" className="text-body-s text-ink-2">
              {ht('count', { n: shown.length })}
            </p>

            {shown.length === 0 ? (
              <EmptyState
                icon={Search}
                title={ht('empty.filtered.title')}
                description={ht('empty.filtered.body')}
                action={
                  <Button variant="secondary" onClick={() => setFilters((f) => ({ ...defaultFilters, sort: f.sort }))}>
                    {ht('filter.reset')}
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-md border border-line bg-surface p-1">
                {shown.map((r) => (
                  <Row key={r.key} row={r} onOpen={() => setOpen(r)} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      <HistoryDetail row={open} onClose={() => setOpen(null)} />
    </PageBody>
  )
}
