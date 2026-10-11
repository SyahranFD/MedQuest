import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Small line above the title (a Badge, a step label). */
  eyebrow?: ReactNode
  /** Right-aligned controls; they wrap under the title on mobile. */
  actions?: ReactNode
  /** Search, filters and toggles for the content below; sits under the description. */
  toolbar?: ReactNode
  className?: string
}

/** Page skeleton: 24/600 title, one muted line, then the toolbar slot. */
export function PageHeader({ title, description, eyebrow, actions, toolbar, className }: PageHeaderProps) {
  return (
    <header data-slot="page-header" className={cn('flex flex-col gap-4 pb-6', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 max-w-2xl flex-col gap-1">
          {eyebrow}
          <h1 className="font-display text-title font-semibold text-ink-1">{title}</h1>
          {description && <p className="text-body-s text-ink-3">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {toolbar && (
        <div data-slot="page-toolbar" className="flex flex-wrap items-center gap-2">
          {toolbar}
        </div>
      )}
    </header>
  )
}
