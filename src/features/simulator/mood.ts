import type { Emotion } from '@/lib/emotion'
import type { Tone } from '@/features/cases/types'

/** Solid badge and bar classes per mood, from tokens only (CLAUDE.md 8.1: solid fills, never tonal). */
export const MOOD_STYLE: Record<Emotion, { badge: string; bar: string }> = {
  netral: { badge: 'bg-neutral text-neutral-ink', bar: 'bg-neutral' },
  cemas: { badge: 'bg-warning text-warning-ink', bar: 'bg-warning' },
  sakit: { badge: 'bg-cat-cardio-fill text-primary-ink', bar: 'bg-cat-cardio-fill' },
  sedih: { badge: 'bg-cat-infection-fill text-primary-ink', bar: 'bg-cat-infection-fill' },
  marah: { badge: 'bg-danger text-danger-ink', bar: 'bg-danger' },
  bingung: { badge: 'bg-cat-neuro-fill text-primary-ink', bar: 'bg-cat-neuro-fill' },
  lega: { badge: 'bg-cat-pulmo-fill text-primary-ink', bar: 'bg-cat-pulmo-fill' },
  senang: { badge: 'bg-success text-success-ink', bar: 'bg-success' },
}

export const TONE_BADGE: Record<Tone, 'success' | 'neutral' | 'warning' | 'danger'> = {
  empatik: 'success',
  netral: 'neutral',
  menyela: 'warning',
  menghakimi: 'danger',
  mengabaikan: 'neutral',
}

/** Trust change as shown next to the meter: "+5", "-3", "-0.5". Null when too small to show. */
export function formatDelta(delta: number | undefined): string | null {
  if (delta === undefined || Math.abs(delta) < 0.05) return null
  const rounded = Math.round(delta * 10) / 10
  const text = Number.isInteger(rounded) ? String(Math.abs(rounded)) : Math.abs(rounded).toFixed(1)
  return `${rounded > 0 ? '+' : '-'}${text}`
}

/** A change big enough to wash the screen edge in green or red. */
export const BIG_CHANGE = 4

export function tintFor(delta: number | undefined): 'good' | 'bad' | null {
  if (delta === undefined || Math.abs(delta) < BIG_CHANGE) return null
  return delta > 0 ? 'good' : 'bad'
}

export interface ReasonInput {
  tone?: Tone
  withheld?: boolean
  unclear?: boolean
  trustDelta?: number
  interrupted?: boolean
}

/** i18n key (under `reason.`) of the sentence that explains why trust moved. */
export function reasonKey(r: ReasonInput): string | null {
  if (r.withheld) return 'withheld'
  if (r.interrupted) return 'interrupted'
  if (r.unclear) return 'unclear'
  if (r.tone && r.tone !== 'netral') return r.tone
  if (r.trustDelta !== undefined && r.trustDelta < 0) return 'streak'
  if (r.tone === 'netral') return 'netral'
  return null
}
