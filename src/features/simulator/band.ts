import type { Band } from '@/features/cases/types'

export const BAND_VARIANT: Record<Band, 'success' | 'info' | 'warning' | 'danger'> = {
  excellent: 'success',
  good: 'success',
  pass: 'info',
  borderline: 'warning',
  'clear-fail': 'danger',
}
