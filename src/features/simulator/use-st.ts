import { useCallback } from 'react'
import { useT, type MessageVars } from '@/lib/i18n'
import './i18n'

/** Translator scoped to the `simulator` namespace: `st('hud.trust')`. */
export function useST() {
  const t = useT()
  return useCallback((key: string, vars?: MessageVars) => t(`simulator.${key}`, vars), [t])
}

export type ST = ReturnType<typeof useST>
