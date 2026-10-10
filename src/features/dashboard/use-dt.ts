import { useCallback } from 'react'
import { useLocale, useT, type MessageVars } from '@/lib/i18n'
import { DIMENSION_LABELS, type Dimension } from '@/features/cases/types'
import { formatShortDate } from './format'
import './i18n'
import type { DashboardKey } from './i18n'

export type Dt = (key: DashboardKey, vars?: MessageVars) => string

/** Translator for the `dashboard` namespace plus a few locale-aware formatters. */
export function useDt() {
  const t = useT()
  const [locale] = useLocale()
  const dt = useCallback<Dt>((key, vars) => t(`dashboard.${key}`, vars), [t])
  const dimension = useCallback((d: Dimension) => DIMENSION_LABELS[d][locale] ?? DIMENSION_LABELS[d].id, [locale])
  const date = useCallback((iso: string) => formatShortDate(iso, locale), [locale])
  const daysAgo = useCallback(
    (days: number | null) => {
      if (days === null) return dt('never')
      if (days <= 0) return dt('days.today')
      if (days === 1) return dt('days.yesterday')
      return dt('days.ago', { n: days })
    },
    [dt],
  )
  return { dt, dimension, date, daysAgo, locale }
}
