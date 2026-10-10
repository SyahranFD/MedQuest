import { useId } from 'react'
import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  label: string
  hint?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

/** Small radiogroup of pills for settings. */
export function Segmented<T extends string>({ label, hint, value, options, onChange }: SegmentedProps<T>) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <p id={id} className="text-body-s font-semibold text-ink-1">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="flex w-full gap-1 rounded-sm bg-panel p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-11 flex-1 rounded-xs px-2 text-body-s font-medium transition-[background-color,color,transform] duration-100 active:scale-[.985] md:min-h-9',
              value === o.value ? 'bg-surface font-semibold text-ink-1' : 'text-ink-2 hover:text-ink-1',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-label text-ink-muted">{hint}</p>}
    </div>
  )
}
