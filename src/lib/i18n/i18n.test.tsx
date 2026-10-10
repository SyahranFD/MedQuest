import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useReducedMotion } from '@/lib/motion'
import { useUiStore } from '@/stores/ui'
import { en } from './en'
import { id } from './id'
import { hasMessage, registerMessages, translate, useLocale, useT } from './index'

beforeEach(() => {
  useUiStore.setState({ locale: 'id', reducedMotion: 'system' })
})

describe('dictionaries', () => {
  it('en has exactly the keys of id', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort())
  })

  it('has no em dashes in copy', () => {
    expect([...Object.values(id), ...Object.values(en)].filter((v) => v.includes('—'))).toEqual([])
  })
})

describe('translate', () => {
  it('interpolates variables and keeps unknown placeholders', () => {
    expect(translate('id', 'legal.updated', { date: '1 Okt 2026' })).toBe('Terakhir diperbarui 1 Okt 2026')
    expect(translate('en', 'legal.updated')).toBe('Last updated {date}')
  })

  it('returns the key itself when missing', () => {
    expect(translate('en', 'nope.missing')).toBe('nope.missing')
  })
})

describe('registerMessages', () => {
  it('is synchronous and namespaced, in both locales', () => {
    registerMessages('demo', { id: { hello: 'Halo {name}' }, en: { hello: 'Hello {name}' } })
    expect(hasMessage('demo.hello')).toBe(true)
    expect(translate('id', 'demo.hello', { name: 'Ani' })).toBe('Halo Ani')
    expect(translate('en', 'demo.hello', { name: 'Ani' })).toBe('Hello Ani')
  })
})

describe('useT and the ui store', () => {
  it('switches language, updates <html lang>, and persists the choice', () => {
    const { result } = renderHook(() => ({ t: useT(), locale: useLocale() }))
    expect(result.current.t('nav.cases')).toBe('Kasus')

    act(() => result.current.locale[1]('en'))

    expect(result.current.t('nav.cases')).toBe('Cases')
    expect(document.documentElement.lang).toBe('en')
    expect(JSON.parse(localStorage.getItem('mq-ui')!).state.locale).toBe('en')
  })
})

describe('useReducedMotion', () => {
  it('lets the store override the OS setting', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => useUiStore.getState().setReducedMotion('reduce'))
    expect(result.current).toBe(true)
  })
})
