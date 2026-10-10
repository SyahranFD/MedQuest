import { useId, type ReactNode } from 'react'
import { ErrorState } from '@/components/page/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { useDt } from '../use-dt'

interface PanelProps {
  title: ReactNode
  description?: ReactNode
  /** Right side of the heading row (a link or a small control). */
  aside?: ReactNode
  className?: string
  children: ReactNode
}

/** Hairline section with a heading row. Plain surface, no shadow. */
export function Panel({ title, description, aside, className, children }: PanelProps) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-5 rounded-md border border-line bg-surface p-5 sm:p-6', className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 max-w-xl flex-col gap-1">
          <h2 id={id} className="font-display text-heading-card font-semibold text-ink-1">
            {title}
          </h2>
          {description && <p className="text-body-s text-ink-2">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  )
}

/** Skeleton rows shaped like a list of label and bar pairs. */
export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  const t = useT()
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

export function PanelError({ onRetry }: { onRetry: () => void }) {
  const { dt } = useDt()
  return <ErrorState title={dt('loadError')} description={dt('loadErrorBody')} onRetry={onRetry} className="py-8" />
}
