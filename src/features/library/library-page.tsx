import { useQuery } from '@tanstack/react-query'
import { ListFilter, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { EmptyState } from '@/components/page/empty-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ALL_CASES } from '@/features/cases/data'
import { listCases } from '@/features/cases/repository'
import type { Difficulty, Mode } from '@/features/cases/types'
import { listSessionResults } from '@/features/session/repository'
import { usePageTitle } from '@/lib/use-page-title'
import { cn } from '@/lib/utils'
import { CaseCard, CategoryBadge } from './case-card'
import { caseProgress, categoriesOf, emptyFilters, filterCases, isFiltering, type LibraryFilters } from './filter'
import { libraryKeys } from './keys'
import { useLt } from './use-lt'

const MODES: readonly (Mode | 'all')[] = ['all', 'er', 'poli']
const LEVELS: readonly (Difficulty | 'all')[] = ['all', 'mudah', 'sedang', 'sulit']

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

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-body-s font-medium text-ink-1">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

/** /app/kasus: student case library with filters. */
export function LibraryPage() {
  const lt = useLt()
  const uid = useId()
  const [filters, setFilters] = useState<LibraryFilters>(emptyFilters)
  const cases = useQuery({ queryKey: libraryKeys.cases, queryFn: () => listCases() })
  const history = useQuery({ queryKey: libraryKeys.sessions, queryFn: listSessionResults })
  usePageTitle(lt('title'))

  const all = cases.data ?? ALL_CASES
  const shown = useMemo(() => filterCases(all, filters), [all, filters])
  const categories = categoriesOf(all)
  const set = (patch: Partial<LibraryFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const loading = cases.isPending || history.isPending
  const [open, setOpen] = useState(false)
  const active = [filters.mode, filters.category, filters.difficulty].filter((v) => v !== 'all').length

  return (
    <PageBody wide className="flex flex-col gap-6">
      <PageHeader title={lt('title')} description={lt('desc')} className="pb-0" />

      <div className="flex flex-col gap-4 rounded-md border border-line bg-surface p-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="flex w-full items-end gap-2 sm:w-72">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor={`${uid}-q`}>{lt('search')}</Label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
                <Input id={`${uid}-q`} type="search" value={filters.query} placeholder={lt('search.placeholder')} onChange={(e) => set({ query: e.target.value })} className="pl-9" />
              </div>
            </div>
            <Button variant="secondary" className="sm:hidden" aria-expanded={open} aria-controls={`${uid}-filters`} onClick={() => setOpen((o) => !o)}>
              <ListFilter aria-hidden="true" />
              {lt('filter.toggle')}
              {active > 0 && ` (${active})`}
            </Button>
          </div>
          <div id={`${uid}-filters`} className={cn('w-full flex-col gap-4 sm:contents', open ? 'flex' : 'hidden')}>
          <Group label={lt('filter.mode')}>
            {MODES.map((m) => (
              <Chip key={m} pressed={filters.mode === m} onClick={() => set({ mode: m })}>
                {lt(`mode.${m}`)}
              </Chip>
            ))}
          </Group>
          <Group label={lt('filter.specialty')}>
            <Chip pressed={filters.category === 'all'} onClick={() => set({ category: 'all' })}>
              {lt('category.all')}
            </Chip>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={filters.category === c}
                onClick={() => set({ category: filters.category === c ? 'all' : c })}
                className={cn(
                  'inline-flex h-11 items-center rounded-full p-0.5 transition-[box-shadow,transform] duration-100 active:scale-[.985] sm:h-9',
                  filters.category === c ? 'ring-2 ring-ink-1 ring-offset-2 ring-offset-surface' : 'hover:ring-2 hover:ring-line-strong hover:ring-offset-2 hover:ring-offset-surface',
                )}
              >
                <CategoryBadge category={c} />
              </button>
            ))}
          </Group>
          <Group label={lt('filter.difficulty')}>
            {LEVELS.map((d) => (
              <Chip key={d} pressed={filters.difficulty === d} onClick={() => set({ difficulty: d })}>
                {lt(`difficulty.${d}`)}
              </Chip>
            ))}
          </Group>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-ink-2">
        {isFiltering(filters) ? lt('count.of', { n: shown.length, total: all.length }) : lt('count', { n: all.length })}
        {history.data && <span className="text-ink-muted">{lt('tried', { done: all.filter((c) => caseProgress(c.id, history.data).status === 'completed').length, total: all.length })}</span>}
        {isFiltering(filters) && (
          <Button variant="link" onClick={() => setFilters(emptyFilters)}>
            {lt('reset')}
          </Button>
        )}
      </p>

      {loading ? (
        <div aria-hidden="true" className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Search}
          title={lt('empty.title')}
          description={lt('empty.body')}
          action={
            <Button variant="secondary" onClick={() => setFilters(emptyFilters)}>
              {lt('reset')}
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-5">
          {shown.map((c) => (
            <CaseCard key={c.id} kase={c} progress={caseProgress(c.id, history.data ?? [])} />
          ))}
        </ul>
      )}
      <p className="text-label text-ink-muted">{lt('note')}</p>
    </PageBody>
  )
}
