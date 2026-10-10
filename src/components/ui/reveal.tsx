import { motion, type Variants } from 'motion/react'
import { createContext, use, type ComponentProps, type ReactNode } from 'react'
import { crossFade, ease, reveal, useInView, useReducedMotion } from '@/lib/motion'

const GroupContext = createContext(false)

function variantsFor(reduced: boolean, distance: number, duration: number, delay: number): Variants {
  return {
    hide: reduced ? { opacity: 0 } : { opacity: 0, y: distance },
    show: reduced
      ? { opacity: 1, transition: crossFade }
      : { opacity: 1, y: 0, transition: { duration, ease: ease.reveal, delay } },
  }
}

type MotionDivProps = Omit<ComponentProps<typeof motion.div>, 'variants' | 'initial' | 'animate'>

interface RevealProps extends MotionDivProps {
  children?: ReactNode
  /** Fade-up distance in px. Default 32. */
  y?: number
  /** Seconds. Default 0.75. */
  duration?: number
  /** Extra delay in seconds (ignored inside a RevealGroup, which staggers). */
  delay?: number
}

/**
 * Fade-up on first entering the viewport (transform + opacity only). Inside a `RevealGroup` it
 * joins the stagger instead of observing on its own. Cross-fades under reduced motion.
 */
export function Reveal({ y = reveal.distance, duration = reveal.duration, delay = 0, ...props }: RevealProps) {
  const reduced = useReducedMotion()
  const inGroup = use(GroupContext)
  const [ref, inView] = useInView<HTMLDivElement>({ margin: reveal.margin })
  const variants = variantsFor(reduced, y, duration, delay)

  if (inGroup) return <motion.div data-slot="reveal" variants={variants} {...props} />
  return (
    <motion.div
      ref={ref}
      data-slot="reveal"
      variants={variants}
      initial="hide"
      animate={inView ? 'show' : 'hide'}
      {...props}
    />
  )
}

interface RevealGroupProps extends MotionDivProps {
  /** Seconds between children. Default 0.09. */
  stagger?: number
  /** Seconds before the first child. */
  delay?: number
}

/** Staggers every `Reveal` descendant once the group enters the viewport. */
export function RevealGroup({ stagger = reveal.stagger, delay = 0, ...props }: RevealGroupProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>({ margin: reveal.margin })
  const variants: Variants = {
    hide: {},
    show: { transition: { staggerChildren: reduced ? 0 : stagger, delayChildren: delay } },
  }
  return (
    <GroupContext value={true}>
      <motion.div
        ref={ref}
        data-slot="reveal-group"
        variants={variants}
        initial="hide"
        animate={inView ? 'show' : 'hide'}
        {...props}
      />
    </GroupContext>
  )
}
