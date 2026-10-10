import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { Progress } from '@/components/ui/progress'
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

const cell = 'px-4 py-3 align-middle'

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
        className={cn('px-4 py-1 text-left text-label font-semibold text-ink-2 uppercase', className)}
      >
        <button
          type="button"
          onClick={() => onSort(key)}
          className="-mx-2 inline-flex min-h-11 items-center gap-1.5 rounded-xs px-2 uppercase transition-colors duration-100 hover:text-ink-1 active:scale-[.985]"
        >
          {label}
          <Icon aria-hidden="true" className={cn('size-3.5', !active && 'text-ink-4')} strokeWidth={2.25} />
          {active && <span className="sr-only">{dt(sortDir === 'asc' ? 'students.sortAsc' : 'students.sortDesc')}</span>}
        </button>
      </th>
    )
  }

  return (
    <>
    <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface sm:hidden" aria-label={dt('students.caption')}>
      {rows.map((s) => (
        <li key={s.id}>
          <Link
            to={'/dosen/mahasiswa/$studentId' as '/'}
            params={{ studentId: s.id } as never}
            className="flex min-h-11 items-center gap-3 px-4 py-3 transition-colors duration-100 active:bg-panel"
          >
            <Avatar initials={s.initials} />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex items-start justify-between gap-2">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold text-ink-1">{s.name}</span>
                  <span className="text-label text-ink-muted">{s.nim}</span>
                </span>
                <StatusBadge status={s.status} />
              </span>
              <Progress value={s.progress} aria-hidden="true" className="h-1.5" />
              <span className="flex justify-between text-label text-ink-muted tabular-nums">
                <span>{dt('students.progressText', { done: s.casesCompleted, total: s.casesTotal })}</span>
                <span className="font-semibold text-ink-1">{s.averagePercent ?? dt('students.noScore')}</span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
    <div className="hidden overflow-x-auto rounded-md border border-line bg-surface sm:block">
      <table className="w-full min-w-[46rem] border-collapse text-body-s">
        <caption className="sr-only">{dt('students.caption')}</caption>
        <thead className="border-b border-line-strong bg-panel">
          <tr>
            {head('name', dt('students.col.name'), 'sticky left-0 z-10 bg-panel')}
            {head('progress', dt('students.col.progress'))}
            {head('average', dt('students.col.average'))}
            {head('lastActive', dt('students.col.last'))}
            {head('status', dt('students.col.status'))}
          </tr>
        </thead>
        <tbody onKeyDown={moveFocus} className="divide-y divide-line">
          {rows.map((s) => (
            <tr key={s.id} className="transition-colors duration-100 hover:bg-panel/60">
              <th scope="row" className={cn(cell, 'sticky left-0 z-10 bg-surface text-left font-normal')}>
                <Link
                  to={'/dosen/mahasiswa/$studentId' as '/'}
                  params={{ studentId: s.id } as never}
                  data-row-link
                  className="-m-1 flex min-h-11 items-center gap-3 rounded-sm p-1"
                >
                  <Avatar initials={s.initials} />
                  <span className="flex min-w-0 flex-col">
                    <span className="max-w-44 truncate font-semibold text-ink-1">{s.name}</span>
                    <span className="text-label text-ink-muted">{s.nim}</span>
                  </span>
                </Link>
              </th>
              <td className={cn(cell, 'min-w-44')}>
                <div className="flex flex-col gap-1.5">
                  <Progress value={s.progress} aria-label={dt('students.progressText', { done: s.casesCompleted, total: s.casesTotal })} className="h-1.5" />
                  <span className="text-label text-ink-muted tabular-nums">{dt('students.progressText', { done: s.casesCompleted, total: s.casesTotal })}</span>
                </div>
              </td>
              <td className={cn(cell, 'font-semibold text-ink-1 tabular-nums')}>{s.averagePercent ?? <span className="font-normal text-ink-muted">{dt('students.noScore')}</span>}</td>
              <td className={cell}>
                <span className="block text-ink-1">{daysAgo(s.daysSinceActive)}</span>
                {s.lastActiveAt && <span className="text-label text-ink-muted">{date(s.lastActiveAt)}</span>}
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
