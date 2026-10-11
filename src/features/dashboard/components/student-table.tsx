import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import type { SortDir, SortKey } from '../student-table'
import type { StudentSummary } from '../types'
import { useDt } from '../use-dt'
import { Avatar } from './avatar'
import { StatusBadge } from './badges'

interface StudentTableProps {
  rows: readonly StudentSummary[]
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

const cell = 'px-3 align-middle first:rounded-l-row last:rounded-r-row'

function moveFocus(e: KeyboardEvent<HTMLTableSectionElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const links = [...e.currentTarget.querySelectorAll<HTMLAnchorElement>('a[data-row-link]')]
  const at = links.indexOf(document.activeElement as HTMLAnchorElement)
  if (at < 0) return
  const next = links[at + (e.key === 'ArrowDown' ? 1 : -1)]
  if (next) {
    next.focus()
    e.preventDefault()
  }
}

export function StudentTable({ rows, sortKey, sortDir, onSort }: StudentTableProps) {
  const { dt, date, daysAgo } = useDt()

  const head = (key: SortKey, label: string, className?: string) => {
    const active = sortKey === key
    const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown
    return (
      <th
        scope="col"
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={cn('border-b border-line px-3 text-left text-meta font-medium text-ink-3', className)}
      >
        <button
          type="button"
          onClick={() => onSort(key)}
          className={cn(
            '-mx-2 inline-flex h-10 items-center gap-1.5 rounded-row px-2 transition-colors duration-100 hover:text-ink-1 pointer-coarse:h-11',
            active && 'text-ink-1',
            className?.includes('text-right') && 'flex-row-reverse',
          )}
        >
          {label}
          <Icon aria-hidden="true" className={cn('size-3.5', !active && 'text-ink-4')} strokeWidth={1.5} />
          {active && <span className="sr-only">{dt(sortDir === 'asc' ? 'students.sortAsc' : 'students.sortDesc')}</span>}
        </button>
      </th>
    )
  }

  return (
    <>
      <ul className="flex flex-col sm:hidden" aria-label={dt('students.caption')}>
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              to={'/dosen/mahasiswa/$studentId' as '/'}
              params={{ studentId: s.id } as never}
              className="flex min-h-14 items-center gap-3 rounded-row px-2 py-2 transition-colors duration-100 active:bg-hover"
            >
              <Avatar initials={s.initials} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body-s font-medium text-ink-1">{s.name}</span>
                <span className="text-meta text-ink-3">
                  {s.nim}, {dt('students.progressText', { done: s.casesCompleted, total: s.casesTotal })}
                </span>
              </span>
              <span className="w-8 text-right text-body-s text-ink-2 tabular-nums">{s.averagePercent ?? '-'}</span>
              <StatusBadge status={s.status} />
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-body-s">
          <caption className="sr-only">{dt('students.caption')}</caption>
          <thead>
            <tr className="h-10">
              {head('name', dt('students.col.name'))}
              {head('progress', dt('students.col.progress'))}
              {head('average', dt('students.col.average'), 'w-36 text-right')}
              {head('lastActive', dt('students.col.last'))}
              {head('status', dt('students.col.status'), 'w-36')}
            </tr>
          </thead>
          <tbody onKeyDown={moveFocus} className="[&_tr]:h-14">
            {rows.map((s) => (
              <tr key={s.id} className="group transition-colors duration-100 hover:bg-hover">
                <th scope="row" className={cn(cell, 'text-left font-normal')}>
                  <Link
                    to={'/dosen/mahasiswa/$studentId' as '/'}
                    params={{ studentId: s.id } as never}
                    data-row-link
                    className="-m-1 flex items-center gap-3 rounded-row p-1"
                  >
                    <Avatar initials={s.initials} />
                    <span className="flex min-w-0 flex-col">
                      <span className="max-w-56 truncate font-medium text-ink-1">{s.name}</span>
                      <span className="text-meta text-ink-3">{s.nim}</span>
                    </span>
                  </Link>
                </th>
                <td className={cn(cell, 'text-ink-2 tabular-nums')}>{dt('students.progressText', { done: s.casesCompleted, total: s.casesTotal })}</td>
                <td className={cn(cell, 'text-right font-medium text-ink-1 tabular-nums')}>
                  {s.averagePercent ?? <span className="font-normal text-ink-3">{dt('students.noScore')}</span>}
                </td>
                <td className={cell}>
                  <span className="block text-ink-2">{daysAgo(s.daysSinceActive)}</span>
                  {s.lastActiveAt && <span className="text-meta text-ink-3">{date(s.lastActiveAt)}</span>}
                </td>
                <td className={cell}>
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
