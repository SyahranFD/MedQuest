import type { Patient } from '../types'
import { avatarSpec } from '../avatar'

const fill = (color: string) => ({ fill: color })

/** Flat 2D bust, seeded from the case id so the same case always shows the same person. */
export function PatientAvatar({ patient, seed }: { patient: Pick<Patient, 'age' | 'gender'>; seed: string }) {
  const a = avatarSpec(patient, seed)
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" data-style={a.style} className="block size-full">
      <path d="M8 100c2-20 16-30 42-30s40 10 42 30z" style={fill(a.cloth)} />
      <rect x="43" y="62" width="14" height="12" rx="5" style={{ ...fill(a.skin), filter: 'brightness(.9)' }} />
      {a.style === 'hijab' && <ellipse cx="50" cy="46" rx="29" ry="31" style={fill(a.hair)} />}
      <circle cx="50" cy="46" r="19" style={fill(a.skin)} />
      {a.style === 'short' && <path d="M31 43c0-12 8-18 19-18s19 6 19 18c-4-5-10-7-19-7s-15 2-19 7z" style={fill(a.hair)} />}
      <circle cx="43" cy="47" r="2" style={fill('var(--mq-avatar-ink)')} />
      <circle cx="57" cy="47" r="2" style={fill('var(--mq-avatar-ink)')} />
      {a.glasses && (
        <g fill="none" strokeWidth="1.6" style={{ stroke: 'var(--mq-ink-2)' }}>
          <circle cx="42" cy="46" r="5" />
          <circle cx="58" cy="46" r="5" />
          <path d="M47 46h6" />
        </g>
      )}
      <path d="M44 55q6 5 12 0" fill="none" strokeWidth="1.8" strokeLinecap="round" style={{ stroke: 'var(--mq-avatar-ink)' }} />
    </svg>
  )
}
