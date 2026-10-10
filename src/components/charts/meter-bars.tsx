import { useInView, useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface MeterRow {
  key: string
  label: string
  /** 0 to 100. */
  value: number
  /** Optional reference value drawn as a tick (for example the class average). */
  compare?: number
  /** Short note under the label (for example a case title). */
  note?: string
}

interface MeterBarsProps {
  rows: readonly MeterRow[]
  /** Builds the accessible name of one meter. */
  describe: (row: MeterRow) => string
  /** Legend text for the tick, shown when any row has `compare`. */
  compareLabel?: string
  format?: (value: number) => string
  className?: string
}

/** Horizontal bars for 0 to 100 values: thin, rounded data end, value printed at the end. */
export function MeterBars({ rows, describe, compareLabel, format = (v) => String(Math.round(v)), className }: MeterBarsProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLUListElement>({ margin: '0px 0px -10% 0px' })
  const hasCompare = rows.some((r) => r.compare !== undefined)
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <ul ref={ref} className="flex flex-col gap-4">
        {rows.map((row, i) => (
          <li key={row.key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3 gap-y-1.5">
            <span className="min-w-0 text-body-s font-medium text-ink-1">
              {row.label}
              {row.note && <span className="block truncate font-normal text-ink-muted">{row.note}</span>}
            </span>
            <span className="text-body-s font-semibold text-ink-1 tabular-nums">{format(row.value)}</span>
            <div
              role="meter"
              aria-label={describe(row)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(row.value)}
              className="relative col-span-2 h-2 rounded-full bg-inset"
            >
              <div
                className="h-full origin-left rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, Math.max(0, row.value))}%`,
                  transform: reduced || inView ? 'scaleX(1)' : 'scaleX(0)',
                  transition: reduced ? 'none' : `transform 600ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 50}ms`,
                }}
              />
              {row.compare !== undefined && (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-1"
                  style={{ left: `${Math.min(100, Math.max(0, row.compare))}%` }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
      {hasCompare && compareLabel && (
        <p className="flex items-center gap-2 text-label text-ink-muted">
          <span aria-hidden="true" className="inline-block h-3.5 w-0.5 rounded-full bg-ink-1" />
          {compareLabel}
        </p>
      )}
    </div>
  )
}
