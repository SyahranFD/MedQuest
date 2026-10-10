import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Defaults to the generic "Belum ada isi". */
  title?: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  /** A Button (or link styled as one): the way out of the empty state. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
  const t = useT()
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-dashed border-line-strong bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-md bg-panel text-ink-2">
        <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 className="font-display text-heading-card font-semibold text-ink-1">{title ?? t('state.empty.title')}</h2>
      <p className="max-w-sm text-body-s text-ink-2">{description ?? t('state.empty.body')}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
