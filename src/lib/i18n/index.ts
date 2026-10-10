import { en } from './en'
import { id, type CoreKey } from './id'
import type { Locale } from '@/stores/ui'

export type { Locale } from '@/stores/ui'
export type { CoreKey } from './id'

/** Core keys autocomplete; feature keys are `<namespace>.<key>` strings. */
export type MessageKey = CoreKey | (string & {})
export type MessageVars = Record<string, string | number>

const dictionaries: Record<Locale, Record<string, string>> = { id: { ...id }, en: { ...en } }

/**
 * Add a feature's strings. Call at module top level of `src/features/<x>/i18n.ts` (synchronous,
 * runs at import time). Keys become `${namespace}.${key}`. Both locales must define the same keys.
 * Re-registering a namespace replaces it (HMR safe).
 */
export function registerMessages<K extends string>(
  namespace: string,
  messages: { id: Record<K, string>; en: Record<K, string> },
) {
  for (const locale of ['id', 'en'] as const) {
    for (const [key, value] of Object.entries<string>(messages[locale])) {
      dictionaries[locale][`${namespace}.${key}`] = value
    }
  }
}

export function translate(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const template = dictionaries[locale][key] ?? dictionaries.id[key]
  if (template === undefined) return key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m))
}

export function hasMessage(key: string) {
  return key in dictionaries.id
}

export { useT, useLocale, type TFunction } from './use-t'
