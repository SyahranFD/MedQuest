import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useInView, useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

export interface LineSeries {
  id: string
  label: string
  /** One value per x label; null leaves a gap. */
  values: readonly (number | null)[]
  /** 'primary' is the brand line, 'ink' is the quiet second line (always dashed so it never relies on hue). */
  tone?: 'primary' | 'ink'
}

export interface LineChartProps {
  series: readonly LineSeries[]
  /** Short axis labels, one per point. */
  xLabels: readonly string[]
  /** Longer names for the tooltip, live region and table. Defaults to `xLabels`. */
  xTitles?: readonly string[]
  /** Short sentence describing what the chart shows (also the accessible name). */
  label: string
  /** Text alternative with the takeaway, read before the table. */
  summary: string
  /** Caption of the disclosure that opens the data table. */
  tableLabel: string
  /** Header of the first table column. */
  xHeader: string
  /** Keyboard hint appended to the accessible name. */
  hint?: string
  domain?: readonly [number, number]
  /** Formats values in the tooltip, table and live region. */
  format?: (value: number) => string
  className?: string
}

const DEFAULT_WIDTH = 640
const NARROW = 520
const LABEL_GAP = 15

const toneClass = {
  primary: { stroke: 'stroke-primary', fill: 'fill-primary', text: 'fill-primary-hover', bg: 'bg-primary' },
  ink: { stroke: 'stroke-ink-2', fill: 'fill-ink-2', text: 'fill-ink-2', bg: 'bg-ink-2' },
} as const

interface Dot {
  x: number
  y: number
  value: number
  index: number
}

function segments(dots: (Dot | null)[]): Dot[][] {
  const out: Dot[][] = []
  let current: Dot[] = []
  for (const d of dots) {
    if (d) current.push(d)
    else if (current.length) {
      out.push(current)
      current = []
    }
  }
  if (current.length) out.push(current)
  return out
}

/** Push end labels apart so two nearby series never overprint. */
function spreadLabels(ys: number[]): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < order.length; k++) {
    const prev = order[k - 1]!
    const cur = order[k]!
    if (cur.y - prev.y < LABEL_GAP) cur.y = prev.y + LABEL_GAP
  }
  const out = ys.slice()
  for (const o of order) out[o.i] = o.y
  return out
}

/** Hand-built SVG line chart: direct labels, hover and keyboard crosshair, table alternative. */
export function LineChart({
  series,
  xLabels,
  xTitles,
  label,
  summary,
  tableLabel,
  xHeader,
  hint,
  domain = [0, 100],
  format = (v) => String(Math.round(v)),
  className,
}: LineChartProps) {
  const uid = useId()
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLElement>({ margin: '0px 0px -10% 0px' })
  const boxRef = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(DEFAULT_WIDTH)
  const [active, setActive] = useState<number | null>(null)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => el.clientWidth > 0 && setW(Math.round(el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const narrow = W < NARROW
  const H = narrow ? 220 : 264
  const M = { top: 14, right: narrow ? 14 : 112, bottom: 30, left: 34 }
  const PLOT_W = W - M.left - M.right
  const PLOT_H = H - M.top - M.bottom
  const n = xLabels.length
  const titleAt = (i: number) => xTitles?.[i] ?? xLabels[i]
  const [lo, hi] = domain
  const xAt = (i: number) => M.left + (n <= 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W)
  const yAt = (v: number) => M.top + PLOT_H - ((v - lo) / (hi - lo)) * PLOT_H

  const ticks = useMemo(() => {
    const step = (hi - lo) / 4
    return Array.from({ length: 5 }, (_, i) => lo + step * i)
  }, [lo, hi])

  const drawn = series.map((s) => {
    const dots = s.values.map((v, i) => (v === null ? null : { x: xAt(i), y: yAt(v), value: v, index: i }))
    const lastDot = [...dots].reverse().find((d): d is Dot => d !== null) ?? null
    return { s, dots, segs: segments(dots), lastDot }
  })
  const labelYs = spreadLabels(drawn.map((d) => d.lastDot?.y ?? 0))

  const labelStep = n > 12 ? Math.ceil(n / 8) : 1

  const setFromPointer = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * PLOT_W
    setActive(Math.min(n - 1, Math.max(0, Math.round((x / PLOT_W) * (n - 1)))))
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') setActive((a) => Math.min(n - 1, (a ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? n) - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(n - 1)
    else if (e.key === 'Escape') setActive(null)
    else return
    e.preventDefault()
  }

  const readout =
    active === null
      ? ''
      : `${titleAt(active)}: ${series.map((s) => `${s.label} ${s.values[active] === null || s.values[active] === undefined ? '-' : format(s.values[active]!)}`).join(', ')}`

  return (
    <figure ref={ref} className={cn('flex flex-col gap-3', className)}>
      <div
        ref={boxRef}
        tabIndex={0}
        role="group"
        aria-label={hint ? `${label}. ${hint}` : label}
        aria-describedby={`${uid}-summary`}
        onKeyDown={onKey}
        onBlur={() => setActive(null)}
        className="relative rounded-sm outline-offset-4"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-pan-y select-none" aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={yAt(t)} y2={yAt(t)} className="stroke-line" strokeWidth={1} />
              <text x={M.left - 8} y={yAt(t) + 4} textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
                {format(t)}
              </text>
            </g>
          ))}
          {xLabels.map((l, i) =>
            i % labelStep === 0 || i === n - 1 ? (
              <text key={l + i} x={xAt(i)} y={H - 8} textAnchor="middle" className="fill-ink-muted text-[11px]">
                {l}
              </text>
            ) : null,
          )}

          {active !== null && (
            <line x1={xAt(active)} x2={xAt(active)} y1={M.top} y2={M.top + PLOT_H} className="stroke-line-strong" strokeWidth={1} />
          )}

          {drawn.map(({ s, segs, dots, lastDot }, k) => {
            const tone = toneClass[s.tone ?? 'primary']
            return (
              <g key={s.id}>
                {segs.map((seg, si) => (
                  <path
                    key={si}
                    d={seg.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x.toFixed(1)} ${d.y.toFixed(1)}`).join(' ')}
                    pathLength={1}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={s.tone === 'ink' ? '0.012 0.008' : 1}
                    style={{
                      strokeDashoffset: reduced || inView || s.tone === 'ink' ? 0 : 1,
                      transition: reduced ? 'none' : 'stroke-dashoffset 800ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                    className={tone.stroke}
                  />
                ))}
                {dots.map((d) =>
                  d ? (
                    <circle
                      key={d.index}
                      cx={d.x}
                      cy={d.y}
                      r={active === d.index ? 5 : 3.5}
                      strokeWidth={2}
                      className={cn('stroke-surface', tone.fill)}
                    />
                  ) : null,
                )}
                {lastDot && !narrow && (
                  <text x={lastDot.x + 12} y={labelYs[k]! + 4} className={cn('text-[12px] font-semibold', tone.text)}>
                    {s.label} {format(lastDot.value)}
                  </text>
                )}
              </g>
            )
          })}

          <rect
            x={M.left - 10}
            y={M.top}
            width={PLOT_W + 20}
            height={PLOT_H}
            fill="transparent"
            onPointerMove={setFromPointer}
            onPointerDown={setFromPointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>

        {active !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 flex min-w-32 -translate-x-1/2 flex-col gap-1 rounded-sm border border-line-strong bg-surface px-3 py-2 text-body-s"
            style={{ left: `${(xAt(active) / W) * 100}%` }}
          >
            <span className="font-semibold text-ink-1">{titleAt(active)}</span>
            {series.map((s) => {
              const v = s.values[active]
              return (
                <span key={s.id} className="flex items-center gap-2 text-ink-2">
                  <span className={cn('size-2 rounded-full', toneClass[s.tone ?? 'primary'].bg)} aria-hidden="true" />
                  <span className="flex-1">{s.label}</span>
                  <span className="font-semibold text-ink-1 tabular-nums">{v === null || v === undefined ? '-' : format(v)}</span>
                </span>
              )
            })}
          </div>
        )}
        <p aria-live="polite" className="sr-only">
          {readout}
        </p>
      </div>

      <figcaption id={`${uid}-summary`} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-ink-2">
        {series.length > 1 && (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {series.map((s) => (
              <span key={s.id} className="flex items-center gap-2">
                <svg width="22" height="8" aria-hidden="true">
                  <line
                    x1="1"
                    x2="21"
                    y1="4"
                    y2="4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={s.tone === 'ink' ? '4 3' : undefined}
                    className={toneClass[s.tone ?? 'primary'].stroke}
                  />
                </svg>
                {s.label}
              </span>
            ))}
          </span>
        )}
        <span className="text-ink-muted">{summary}</span>
      </figcaption>

      <details className="group text-body-s">
        <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-xs font-medium text-primary-hover underline-offset-4 hover:underline">
          {tableLabel}
        </summary>
        <div className="overflow-x-auto pt-2">
          <table className="w-full min-w-72 border-collapse text-left">
            <caption className="sr-only">{label}</caption>
            <thead>
              <tr className="border-b border-line-strong text-ink-muted">
                <th scope="col" className="py-1.5 pr-4 font-medium">
                  {xHeader}
                </th>
                {series.map((s) => (
                  <th key={s.id} scope="col" className="py-1.5 pr-4 font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xLabels.map((l, i) => (
                <tr key={l + i} className="border-b border-line">
                  <th scope="row" className="py-1.5 pr-4 font-normal text-ink-2">
                    {titleAt(i)}
                  </th>
                  {series.map((s) => (
                    <td key={s.id} className="py-1.5 pr-4 text-ink-1 tabular-nums">
                      {s.values[i] === null || s.values[i] === undefined ? '-' : format(s.values[i]!)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
