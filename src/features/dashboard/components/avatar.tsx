import { cn } from '@/lib/utils'

/** Initials on a neutral plate; identity is the name beside it, not a colour. */
export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('grid size-8 shrink-0 place-items-center rounded-full bg-hover text-meta font-medium text-ink-2', className)}
    >
      {initials}
    </span>
  )
}
