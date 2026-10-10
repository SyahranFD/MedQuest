import type { Band } from '@/features/cases/types'

export const BAND_VARIANT: Record<Band, 'success' | 'warning' | 'danger' | 'neutral'> = {
  excellent: 'success',
  good: 'success',
  pass: 'neutral',
  borderline: 'warning',
  'clear-fail': 'danger',
}
