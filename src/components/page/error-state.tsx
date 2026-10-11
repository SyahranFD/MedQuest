import { CircleAlert, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  /** 'offline' swaps the icon and default copy. */
  kind?: 'error' | 'offline'
  title?: ReactNode
  /** Feature `error-copy.ts` output goes here. */
  description?: ReactNode
  /** Shows a "Coba lagi" button when given. */
  onRetry?: () => void
  className?: string
}

export function ErrorState({ kind = 'error', title, description, onRetry, className }: ErrorStateProps) {
  const t = useT()
  const Icon = kind === 'offline' ? WifiOff : CircleAlert
  return (
    <div
      role="alert"
      data-slot="error-state"
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-line bg-raised px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-10 place-items-center rounded-row bg-danger text-danger-ink">
        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2 className="font-display text-section font-semibold text-ink-1">
        {title ?? t(kind === 'offline' ? 'state.offline.title' : 'state.error.title')}
      </h2>
      <p className="max-w-sm text-body-s text-ink-3">
        {description ?? t(kind === 'offline' ? 'state.offline.body' : 'state.error.body')}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
