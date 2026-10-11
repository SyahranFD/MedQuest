import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TINT = {
  teal: 'bg-tint-teal',
  blue: 'bg-tint-blue',
  green: 'bg-tint-green',
  amber: 'bg-tint-amber',
} as const

interface TabHeaderProps {
  icon: LucideIcon
  tint: keyof typeof TINT
  title: string
  hint: string
  /** `start`: tile beside the text. `center`: tile above centred text (form-like tabs). */
  align?: 'start' | 'center'
  trailing?: ReactNode
  className?: string
}

/** Icon tile + title + one-line helper that opens a tablet tab. Each tab picks its own tint and arrangement. */
export function TabHeader({ icon: Icon, tint, title, hint, align = 'start', trailing, className }: TabHeaderProps) {
  const centered = align === 'center'
  return (
    <header className={cn('flex gap-3', centered ? 'flex-col items-center text-center' : 'items-center', className)}>
      <span className={cn('grid shrink-0 place-items-center rounded-md text-ink-1', TINT[tint], centered ? 'size-12' : 'size-10')} aria-hidden="true">
        <Icon className={centered ? 'size-6' : 'size-5'} strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="font-display text-section font-semibold text-ink-1">{title}</h2>
        <p className="text-meta text-ink-3">{hint}</p>
      </div>
      {trailing}
    </header>
  )
}
