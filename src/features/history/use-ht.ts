import { useCallback } from 'react'
import { DIMENSION_LABELS, type Dimension } from '@/features/cases/types'
import { useLocale, useT, type MessageVars } from '@/lib/i18n'
import './i18n'
import type { HistoryKey } from './i18n'

export type Ht = (key: HistoryKey, vars?: MessageVars) => string

/** Translator for the `history` namespace plus locale-aware formatters. */
export function useHt() {
  const t = useT()
  const [locale] = useLocale()
  const ht = useCallback<Ht>((key, vars) => t(`history.${key}`, vars), [t])
  const dimension = useCallback((d: Dimension) => DIMENSION_LABELS[d][locale] ?? DIMENSION_LABELS[d].id, [locale])
  const dateTime = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)),
    [locale],
  )
  const shortDate = useCallback(
    (iso: string) => new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(iso)),
    [locale],
  )
  return { ht, dimension, dateTime, shortDate, locale }
}
