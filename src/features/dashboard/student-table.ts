// Search, filter, sort and paging for the student table. Pure, so it is easy to test.

import type { StudentStatus, StudentSummary } from './types'

export type SortKey = 'name' | 'progress' | 'average' | 'lastActive' | 'status'
export type SortDir = 'asc' | 'desc'
export type ProgressBand = 'all' | 'low' | 'mid' | 'done'

export interface TableState {
  query: string
  status: StudentStatus | 'all'
  progress: ProgressBand
  sortKey: SortKey
  sortDir: SortDir
  page: number
}

export const PAGE_SIZE = 12

export const initialTableState: TableState = {
  query: '',
  status: 'all',
  progress: 'all',
  sortKey: 'name',
  sortDir: 'asc',
  page: 1,
}

const STATUS_RANK: Record<StudentStatus, number> = { inactive: 0, attention: 1, 'on-track': 2 }

function progressBandOf(progress: number): Exclude<ProgressBand, 'all'> {
  if (progress >= 100) return 'done'
  return progress >= 50 ? 'mid' : 'low'
}

const fold = (s: string) => s.toLocaleLowerCase('id').normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function filterStudents(list: readonly StudentSummary[], state: Pick<TableState, 'query' | 'status' | 'progress'>) {
  const q = fold(state.query.trim())
  return list.filter(
    (s) =>
      (state.status === 'all' || s.status === state.status) &&
      (state.progress === 'all' || progressBandOf(s.progress) === state.progress) &&
      (q === '' || fold(s.name).includes(q) || fold(s.nim).includes(q)),
  )
}

function compareBy(key: SortKey, a: StudentSummary, b: StudentSummary): number {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name, 'id')
    case 'progress':
      return a.progress - b.progress
    case 'average':
      return (a.averagePercent ?? -1) - (b.averagePercent ?? -1)
    case 'lastActive':
      return (a.lastActiveAt ?? '').localeCompare(b.lastActiveAt ?? '')
    case 'status':
      return STATUS_RANK[a.status] - STATUS_RANK[b.status]
  }
}

/** Stable sort. Students with no value for the key (no attempts) always sink to the bottom. */
export function sortStudents(list: readonly StudentSummary[], key: SortKey, dir: SortDir) {
  const factor = dir === 'asc' ? 1 : -1
  const empty = (s: StudentSummary) => (key === 'average' && s.averagePercent === null) || (key === 'lastActive' && s.lastActiveAt === null)
  return list.slice().sort((a, b) => {
    if (empty(a) !== empty(b)) return empty(a) ? 1 : -1
    return compareBy(key, a, b) * factor || a.name.localeCompare(b.name, 'id')
  })
}

export function pageCount(total: number, size = PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / size))
}

export function paginate<T>(list: readonly T[], page: number, size = PAGE_SIZE): T[] {
  const safe = Math.min(Math.max(1, page), pageCount(list.length, size))
  return list.slice((safe - 1) * size, safe * size)
}

/** Next direction when a header is activated: new column starts ascending (descending for numbers). */
export function nextSort(state: Pick<TableState, 'sortKey' | 'sortDir'>, key: SortKey): Pick<TableState, 'sortKey' | 'sortDir'> {
  if (state.sortKey === key) return { sortKey: key, sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' }
  return { sortKey: key, sortDir: key === 'name' || key === 'status' ? 'asc' : 'desc' }
}
