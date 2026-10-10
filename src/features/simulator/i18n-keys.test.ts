import { describe, expect, it } from 'vitest'
import { hasMessage, translate } from '@/lib/i18n'
import './i18n'

const sources = import.meta.glob<string>(['./*.ts', './*.tsx', '!./*.test.*', '!./i18n.ts'], { query: '?raw', import: 'default', eager: true })
const copy = import.meta.glob<string>('./i18n.ts', { query: '?raw', import: 'default', eager: true })

describe('simulator copy', () => {
  it('defines every literal st() key in both locales, without em dashes', () => {
    const keys = new Set<string>()
    for (const text of Object.values(sources)) {
      for (const m of text.matchAll(/\bst\(\s*'([a-zA-Z0-9.-]+)'/g)) keys.add(m[1]!)
    }
    expect(keys.size).toBeGreaterThan(100)
    for (const k of keys) {
      expect(hasMessage(`simulator.${k}`), k).toBe(true)
      expect(translate('en', `simulator.${k}`)).not.toBe(`simulator.${k}`)
    }
    expect(Object.values(copy)[0]!.includes(String.fromCharCode(0x2014))).toBe(false)
  })
})
