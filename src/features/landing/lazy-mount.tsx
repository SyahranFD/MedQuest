import type { ReactNode } from 'react'
import { useInView } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface LazyMountProps {
  children: ReactNode
  /** Rendered until the box nears the viewport (and kept as the box that reserves the space). */
  placeholder: ReactNode
  className?: string
  margin?: string
}

/** Mounts heavy children (WebGL canvases) only once they approach the viewport. Space is reserved by `className`. */
export function LazyMount({ children, placeholder, className, margin = '300px' }: LazyMountProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ margin, amount: 0 })
  return (
    <div ref={ref} className={cn('relative', className)}>
      {inView ? children : placeholder}
    </div>
  )
}
