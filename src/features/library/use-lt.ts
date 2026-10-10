import { useCallback } from 'react'
import { useT, type MessageVars } from '@/lib/i18n'
import './i18n'
import type { LibraryKey } from './i18n'

export type Lt = (key: LibraryKey, vars?: MessageVars) => string

/** Translator for the `library` namespace. */
export function useLt(): Lt {
  const t = useT()
  return useCallback((key, vars) => t(`library.${key}`, vars), [t])
}
