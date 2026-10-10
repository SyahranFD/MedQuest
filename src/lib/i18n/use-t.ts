import { useCallback } from 'react'
import { useUiStore, type Locale } from '@/stores/ui'
import { translate, type MessageKey, type MessageVars } from './index'

export type TFunction = (key: MessageKey, vars?: MessageVars) => string

export function useT(): TFunction {
  const locale = useUiStore((s) => s.locale)
  return useCallback((key, vars) => translate(locale, key, vars), [locale])
}

export function useLocale(): [Locale, (locale: Locale) => void] {
  const locale = useUiStore((s) => s.locale)
  const setLocale = useUiStore((s) => s.setLocale)
  return [locale, setLocale]
}
