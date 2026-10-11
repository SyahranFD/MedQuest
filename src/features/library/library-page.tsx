import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/page/empty-state'
import { PageBody } from '@/components/page/page-body'
import { PageHeader } from '@/components/page/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ALL_CASES } from '@/features/cases/data'
import { CaseFolderGrid, CaseFolderSkeleton } from '@/features/cases/components/case-folder'
import { listCases } from '@/features/cases/repository'
import type { Difficulty, Mode } from '@/features/cases/types'
import { listSessionResults } from '@/features/session/repository'
import { usePageTitle } from '@/lib/use-page-title'
import { caseProgress, categoriesOf, emptyFilters, filterCases, isFiltering, type LibraryFilters } from './filter'
import { libraryKeys } from './keys'
import { useLt } from './use-lt'

const MODES: readonly (Mode | 'all')[] = ['all', 'er', 'poli']
const LEVELS: readonly (Difficulty | 'all')[] = ['all', 'mudah', 'sedang', 'sulit']

/** /app/kasus: student case library, a grid of case folders with one toolbar row of filters. */
export function LibraryPage() {
  const lt = useLt()
  const [filters, setFilters] = useState<LibraryFilters>(emptyFilters)
  const cases = useQuery({ queryKey: libraryKeys.cases, queryFn: () => listCases() })
  const history = useQuery({ queryKey: libraryKeys.sessions, queryFn: listSessionResults })
  usePageTitle(lt('title'))

  const all = cases.data ?? ALL_CASES
  const shown = useMemo(() => filterCases(all, filters), [all, filters])
  const categories = categoriesOf(all)
  const set = (patch: Partial<LibraryFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const loading = cases.isPending || history.isPending
  const reset = () => setFilters(emptyFilters)

  return (
    <PageBody wide className="flex flex-col gap-4">
      <PageHeader
        title={lt('title')}
        description={lt('desc')}
        className="pb-0"
        toolbar={
          <>
            <div className="relative w-full sm:w-64">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
              <Input type="search" value={filters.query} aria-label={lt('search')} placeholder={lt('search.placeholder')} onChange={(e) => set({ query: e.target.value })} className="pl-9" />
            </div>
            <Tabs value={filters.mode} onValueChange={(v) => set({ mode: v as LibraryFilters['mode'] })}>
              <TabsList>
                {MODES.map((m) => (
                  <TabsTrigger key={m} value={m}>
                    {lt(`mode.${m}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Select value={filters.category} onValueChange={(v) => set({ category: v as LibraryFilters['category'] })}>
              <SelectTrigger aria-label={lt('filter.specialty')} className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lt('category.all')}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {lt(`category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.difficulty} onValueChange={(v) => set({ difficulty: v as LibraryFilters['difficulty'] })}>
              <SelectTrigger aria-label={lt('filter.difficulty')} className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {lt(`difficulty.${d}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <p aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-ink-3">
        {isFiltering(filters) ? lt('count.of', { n: shown.length, total: all.length }) : lt('count', { n: all.length })}
        {history.data && <span>{lt('tried', { done: all.filter((c) => caseProgress(c.id, history.data).status === 'completed').length, total: all.length })}</span>}
        {isFiltering(filters) && (
          <Button variant="link" onClick={reset}>
            {lt('reset')}
          </Button>
        )}
      </p>

      {loading ? (
        <CaseFolderSkeleton />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Search}
          title={lt('empty.title')}
          description={lt('empty.body')}
          action={
            <Button variant="secondary" onClick={reset}>
              {lt('reset')}
            </Button>
          }
        />
      ) : (
        <CaseFolderGrid cases={shown} />
      )}
    </PageBody>
  )
}
