import { describe, expect, it } from 'vitest'
import { filterStudents, nextSort, PAGE_SIZE, pageCount, paginate, sortStudents } from './student-table'
import type { StudentSummary } from './types'

const base: StudentSummary = {
  id: 'x',
  name: 'X',
  initials: 'X',
  nim: 'N',
  attemptCount: 3,
  casesCompleted: 3,
  casesTotal: 6,
  progress: 50,
  averagePercent: 70,
  recentPercent: 70,
  averageEmpathy: 50,
  lastActiveAt: '2026-10-01T00:00:00.000Z',
  daysSinceActive: 9,
  dimensionAverages: null,
  weakestDimension: null,
  status: 'on-track',
  reasons: [],
}
const mk = (o: Partial<StudentSummary>): StudentSummary => ({ ...base, ...o })

const list = [
  mk({ id: 'a', name: 'Édi Kurnia', nim: 'FKNM-001', progress: 100, averagePercent: 90, status: 'on-track', lastActiveAt: '2026-10-09T00:00:00.000Z' }),
  mk({ id: 'b', name: 'Bayu Aji', nim: 'FKNM-002', progress: 33, averagePercent: 40, status: 'attention', lastActiveAt: '2026-10-05T00:00:00.000Z' }),
  mk({ id: 'c', name: 'Citra', nim: 'FKNM-003', progress: 0, averagePercent: null, status: 'inactive', lastActiveAt: null }),
  mk({ id: 'd', name: 'Dewi', nim: 'FKNM-004', progress: 67, averagePercent: 75, status: 'inactive', lastActiveAt: '2026-09-01T00:00:00.000Z' }),
]
const ids = (l: StudentSummary[]) => l.map((s) => s.id)

describe('filterStudents', () => {
  const none = { query: '', status: 'all', progress: 'all' } as const
  it('matches name or NIM, ignoring case and accents', () => {
    expect(ids(filterStudents(list, { ...none, query: 'edi' }))).toEqual(['a'])
    expect(ids(filterStudents(list, { ...none, query: 'fknm-002' }))).toEqual(['b'])
  })
  it('filters by status and progress band', () => {
    expect(ids(filterStudents(list, { ...none, status: 'inactive' }))).toEqual(['c', 'd'])
    expect(ids(filterStudents(list, { ...none, progress: 'done' }))).toEqual(['a'])
    expect(ids(filterStudents(list, { ...none, progress: 'low' }))).toEqual(['b', 'c'])
    expect(ids(filterStudents(list, { ...none, progress: 'mid' }))).toEqual(['d'])
  })
  it('combines filters', () => {
    expect(ids(filterStudents(list, { query: 'c', status: 'inactive', progress: 'low' }))).toEqual(['c'])
    expect(filterStudents(list, { query: 'zzz', status: 'all', progress: 'all' })).toEqual([])
  })
})

describe('sortStudents', () => {
  it('sorts by name with Indonesian collation', () => {
    expect(ids(sortStudents(list, 'name', 'asc'))).toEqual(['b', 'c', 'd', 'a'])
  })
  it('sorts numbers both ways and keeps students without a value last', () => {
    expect(ids(sortStudents(list, 'average', 'desc'))).toEqual(['a', 'd', 'b', 'c'])
    expect(ids(sortStudents(list, 'average', 'asc'))).toEqual(['b', 'd', 'a', 'c'])
    expect(ids(sortStudents(list, 'lastActive', 'desc')).at(-1)).toBe('c')
  })
  it('sorts status by urgency and does not mutate the input', () => {
    const before = ids(list)
    expect(sortStudents(list, 'status', 'asc').map((s) => s.status)).toEqual(['inactive', 'inactive', 'attention', 'on-track'])
    expect(ids(list)).toEqual(before)
  })
})

describe('paging and header sort', () => {
  it('pages in blocks of PAGE_SIZE and clamps the page', () => {
    const many = Array.from({ length: 36 }, (_, i) => i)
    expect(pageCount(36)).toBe(Math.ceil(36 / PAGE_SIZE))
    expect(paginate(many, 1)).toHaveLength(PAGE_SIZE)
    expect(paginate(many, 99)[0]).toBe(PAGE_SIZE * (pageCount(36) - 1))
    expect(pageCount(0)).toBe(1)
  })
  it('toggles direction on the same column and picks a sensible start otherwise', () => {
    expect(nextSort({ sortKey: 'name', sortDir: 'asc' }, 'name')).toEqual({ sortKey: 'name', sortDir: 'desc' })
    expect(nextSort({ sortKey: 'name', sortDir: 'asc' }, 'average')).toEqual({ sortKey: 'average', sortDir: 'desc' })
    expect(nextSort({ sortKey: 'average', sortDir: 'desc' }, 'status')).toEqual({ sortKey: 'status', sortDir: 'asc' })
  })
})
