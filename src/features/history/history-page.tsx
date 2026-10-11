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
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import { clearSessionResults, listSessionResults } from '@/features/session/repository'
import { useT } from '@/lib/i18n'
import { usePageTitle } from '@/lib/use-page-title'
import { HistoryDetail, RatingBadge } from './history-detail'
import { historyKeys } from './keys'
import { defaultFilters, filterRows, personalStats, toRows, type HistoryFilters, type HistoryRow, type HistorySort, type RatingFilter } from './stats'
import { useHt } from './use-ht'

const SORTS: readonly HistorySort[] = ['newest', 'oldest', 'high', 'low']
const RATINGS: readonly RatingFilter[] = ['all', 'passed', 'retry']

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <h2 id={id} className="font-display text-section font-semibold text-ink-1">
          {title}
        </h2>
        {description && <p className="text-meta text-ink-3">{description}</p>}
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
        className="flex min-h-16 w-full items-center justify-between gap-4 rounded-card border border-line bg-raised px-4 py-3 text-left transition-colors duration-100 ease-out hover:bg-hover"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-s font-medium text-ink-1">{e.caseTitle}</span>
          <span className="truncate text-meta text-ink-3">
            {ht(`mode.${row.mode}`)} · {dateTime(row.savedAt)}
            {row.demo && ` · ${ht('demo')}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="w-10 text-right text-body-s font-medium text-ink-2 tabular-nums">{e.percent}%</span>
          <RatingBadge band={e.band} />
          <ChevronRight aria-hidden="true" className="size-4 text-ink-4" strokeWidth={1.5} />
        </span>
      </button>
    </li>
  )
}

function RowSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex h-16 items-center justify-between gap-4 rounded-card border border-line bg-raised px-4">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}

/** /app/riwayat: the list of graded cases first, personal overview after. */
export function HistoryPage() {
  const { ht, dimension, shortDate } = useHt()
  const { data, isPending, isError, refetch } = useQuery({ queryKey: historyKeys.sessions, queryFn: listSessionResults })
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters)
  const [open, setOpen] = useState<HistoryRow | null>(null)
  usePageTitle(ht('title'))

  const rows = useMemo(() => toRows(data ?? []), [data])
  const shown = useMemo(() => filterRows(rows, filters), [rows, filters])
  const stats = useMemo(() => personalStats(data ?? []), [data])
  const chronological = useMemo(() => rows.slice().sort((a, b) => a.savedAt.localeCompare(b.savedAt)), [rows])
  const set = (patch: Partial<HistoryFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const dirty = filters.mode !== 'all' || filters.rating !== 'all' || filters.caseId !== 'all' || filters.query !== ''
  const clear = () => setFilters((f) => ({ ...defaultFilters, sort: f.sort }))
  const hasRows = rows.length > 0

  return (
    <PageBody wide className="flex flex-col">
      <PageHeader
        title={ht('title')}
        description={hasRows ? ht('summary', { n: stats.sessions, avg: stats.averagePercent ?? 0, best: stats.bestPercent ?? 0 }) : ht('desc')}
        actions={<ResetButton />}
        className="pb-4"
      />

      {isError && <ErrorState title={ht('loadError')} description={ht('loadErrorBody')} onRetry={() => void refetch()} />}

      {data && !hasRows && (
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

      {(isPending || hasRows) && (
        <div className="flex flex-col gap-12">
          <section aria-label={ht('list')} className="flex flex-col gap-4">
            <Tabs value={filters.mode} onValueChange={(v) => set({ mode: v as HistoryFilters['mode'] })} variant="underline">
              <TabsList aria-label={ht('filter.mode')}>
                {(['all', 'er', 'poli'] as const).map((m) => (
                  <TabsTrigger key={m} value={m}>
                    {ht(`mode.${m}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search aria-hidden="true" strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
                <Input
                  type="search"
                  aria-label={ht('search.label')}
                  placeholder={ht('search.placeholder')}
                  value={filters.query}
                  onChange={(e) => set({ query: e.target.value })}
                  className="pl-9"
                />
              </div>
              <Tabs value={filters.rating} onValueChange={(v) => set({ rating: v as RatingFilter })}>
                <TabsList aria-label={ht('filter.rating')}>
                  {RATINGS.map((r) => (
                    <TabsTrigger key={r} value={r}>
                      {ht(`rating.${r}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Select value={filters.caseId} onValueChange={(v) => set({ caseId: v })}>
                <SelectTrigger aria-label={ht('filter.case')} className="w-full sm:w-52">
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
              <Select value={filters.sort} onValueChange={(v) => set({ sort: v as HistorySort })}>
                <SelectTrigger aria-label={ht('filter.sort')} className="w-full sm:w-40">
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
              {dirty && (
                <Button variant="ghost" onClick={clear}>
                  {ht('filter.reset')}
                </Button>
              )}
            </div>

            {isPending ? (
              <RowSkeleton />
            ) : (
              <>
                <p aria-live="polite" className="px-3 text-meta text-ink-3">
                  {ht('count', { n: shown.length })}
                </p>
                {shown.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title={ht('empty.filtered.title')}
                    description={ht('empty.filtered.body')}
                    action={
                      <Button variant="secondary" onClick={clear}>
                        {ht('filter.reset')}
                      </Button>
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {shown.map((r) => (
                      <Row key={r.key} row={r} onOpen={() => setOpen(r)} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {hasRows && (
            <section aria-label={ht('insights.title')} className="grid gap-x-10 gap-y-10 border-t border-line pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
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
                  <p className="text-body-s text-ink-3">{ht('trend.empty')}</p>
                )}
              </Section>
            </section>
          )}
        </div>
      )}
      <HistoryDetail row={open} onClose={() => setOpen(null)} />
    </PageBody>
  )
}
