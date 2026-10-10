import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const opacity = useTransform(progress, [index / total, (index + 1) / total], [0.62, 1])
  return (
    <>
      <motion.span style={{ opacity }}>{word}</motion.span>{' '}
    </>
  )
}

interface ScrollWordsProps {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'p'
}

/** Headline whose words brighten from .62 to 1 (above 4.5:1 on the ground) as the block crosses the middle of the viewport. */
export function ScrollWords({ text, className, as: Tag = 'h2' }: ScrollWordsProps) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLHeadingElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = text.split(/\s+/).filter(Boolean)

  return (
    <Tag
      ref={ref as never}
      data-slot="scroll-words"
      aria-label={text}
      className={cn('font-display', className)}
    >
      <span aria-hidden="true">
        {reduced
          ? text
          : words.map((w, i) => (
              <Word key={`${w}-${i}`} word={w} index={i} total={words.length} progress={scrollYProgress} />
            ))}
      </span>
    </Tag>
  )
}
