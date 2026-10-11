import { useCallback } from 'react'
import { useT, type MessageVars } from '@/lib/i18n'
import './i18n'
import type { CasesKey } from './i18n'

export type Ct = (key: CasesKey, vars?: MessageVars) => string

/** Translator for the `cases` namespace. */
export function useCt(): Ct {
  const t = useT()
  return useCallback((key, vars) => t(`cases.${key}`, vars), [t])
}
