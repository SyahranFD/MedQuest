import type { Emotion } from '@/lib/emotion'
import { cn } from '@/lib/utils'
import { browTransform, FACE, mouthPath } from './moods'

interface MoodFaceProps {
  emotion: Emotion
  className?: string
}

const INK = 'var(--mq-ink-1)'
const MORPH = 'transform 250ms var(--mq-ease-out)'

/**
 * Original round face: dot eyes, two brow bars, one mouth stroke. Decorative (aria-hidden); the
 * mood name is always rendered as text next to it. Parameters come from `moods.ts`.
 */
export function MoodFace({ emotion, className }: MoodFaceProps) {
  const f = FACE[emotion]
  const left = browTransform(-1, f.tiltL, f.heightL)
  const right = browTransform(1, f.tiltR, f.heightR)
  const mouthOpen = f.open >= 0.2
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-emotion={emotion}
      className={cn('block size-full', className)}
    >
      <g
        style={{ transform: `rotate(${f.roll}deg)`, transformOrigin: '50px 52px' }}
        className="transition-transform duration-300 ease-out motion-reduce:transition-none"
      >
        <circle cx="50" cy="52" r="40" fill="var(--mq-clay-cream)" stroke="var(--mq-line-strong)" strokeWidth="1.5" />
        {f.extra === 'blush' && (
          <>
            <circle cx="29" cy="62" r="6" fill="var(--mq-clay-coral)" opacity="0.5" />
            <circle cx="71" cy="62" r="6" fill="var(--mq-clay-coral)" opacity="0.5" />
          </>
        )}
        {[left, right].map((b, i) => (
          <line
            key={i}
            x1={b.x1}
            x2={b.x2}
            y1={50}
            y2={50}
            stroke={INK}
            strokeWidth="3.4"
            strokeLinecap="round"
            style={{ transform: `translateY(${b.y - 50}px) rotate(${b.rotate}deg)`, transformOrigin: `${b.cx}px 50px`, transition: MORPH }}
          />
        ))}
        {[36, 64].map((cx) => (
          <ellipse
            key={cx}
            cx={cx}
            cy="52"
            rx="3.4"
            ry="3.4"
            fill={INK}
            style={{ transform: `scaleY(${f.eye})`, transformOrigin: `${cx}px 52px`, transition: MORPH }}
          />
        ))}
        <path
          d={mouthPath(f.curve, f.open)}
          style={{ d: `path("${mouthPath(f.curve, f.open)}")`, transition: 'd 250ms var(--mq-ease-out), fill 250ms var(--mq-ease-out)' }}
          fill={mouthOpen ? INK : 'none'}
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {f.extra === 'sweat' && (
          <path d="M78 30 C74 36 73 40 76 43 C79 45 83 43 82 39 C81 36 79 33 78 30 Z" fill="var(--mq-clay-sky)" />
        )}
        {f.extra === 'tear' && (
          <path d="M31 58 C29 62 29 65 31.5 66 C34 66 34 63 33 61 Z" fill="var(--mq-clay-sky)" />
        )}
        {f.extra === 'question' && (
          <path
            d="M76 18 C76 13 84 13 84 18 C84 22 80 22 80 26 M80 30 L80 30.5"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  )
}
