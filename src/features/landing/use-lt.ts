import { useCallback } from 'react'
import { useT, type MessageVars } from '@/lib/i18n'
import './i18n'

/** Translator scoped to the `landing` namespace: `lt('hero.title')`. */
export function useLT() {
  const t = useT()
  return useCallback((key: string, vars?: MessageVars) => t(`landing.${key}`, vars), [t])
}
