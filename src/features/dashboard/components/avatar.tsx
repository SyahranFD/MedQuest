import { cn } from '@/lib/utils'

const TINTS = ['bg-tint-green', 'bg-tint-blue', 'bg-tint-teal', 'bg-tint-amber', 'bg-tint-coral'] as const

/** Initials on a quiet tint (E1). The tint follows the initials so a person keeps the same colour. */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  const tint = TINTS[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % TINTS.length]
  return (
    <span
      aria-hidden="true"
      className={cn('grid size-10 shrink-0 place-items-center rounded-full text-body-s font-semibold text-ink-1', tint, className)}
    >
      {initials}
    </span>
  )
}
