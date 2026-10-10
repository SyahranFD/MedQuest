import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Small line above the title (a Badge, a step label). */
  eyebrow?: ReactNode
  /** Right-aligned controls; they wrap under the title on mobile. */
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-6', className)}
    >
      <div className="flex min-w-0 max-w-2xl flex-col gap-2">
        {eyebrow}
        <h1 className="font-display text-heading-page font-bold text-ink-1">{title}</h1>
        {description && <p className="text-lead text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
