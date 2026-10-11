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
        'flex flex-col items-center gap-3 rounded-card border border-line bg-raised px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-row bg-hover text-ink-3">
        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2 className="font-display text-section font-semibold text-ink-1">{title ?? t('state.empty.title')}</h2>
      <p className="max-w-sm text-body-s text-ink-3">{description ?? t('state.empty.body')}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}
