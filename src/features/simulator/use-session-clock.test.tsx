import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSessionStore } from '@/features/session/store'
import { useSessionClock } from './use-session-clock'

const now = () => useSessionStore.getState().session!.nowSec

describe('useSessionClock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    useSessionStore.getState().startSession({ mode: 'er', caseIds: ['er-acs-stemi'], id: 'clock-test' })
  })
  afterEach(() => {
    vi.useRealTimers()
    useSessionStore.getState().reset()
  })

  it('advances simulated time with real time and scales by speed', () => {
    renderHook(() => useSessionClock(true))
    vi.advanceTimersByTime(2000)
    const t1 = now()
    expect(t1).toBeGreaterThan(1.2)
    expect(t1).toBeLessThanOrEqual(2.1)
    useSessionStore.getState().setSpeed(4)
    vi.advanceTimersByTime(1000)
    expect(now() - t1).toBeGreaterThan(3)
  })

  it('stops when disabled and pauses while the tab is hidden', () => {
    const { rerender } = renderHook(({ on }) => useSessionClock(on), { initialProps: { on: true } })
    vi.advanceTimersByTime(1000)
    rerender({ on: false })
    const frozen = now()
    vi.advanceTimersByTime(1000)
    expect(now()).toBe(frozen)
    rerender({ on: true })
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    vi.advanceTimersByTime(1000)
    expect(now()).toBe(frozen)
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
  })

  it('reports engine events such as a patient arriving', () => {
    useSessionStore.getState().startSession({ mode: 'er', caseIds: ['er-acs-stemi', 'er-dengue-dss'], id: 'clock-test-2', speed: 4 })
    const seen: string[] = []
    renderHook(() => useSessionClock(true, (ev) => ev.forEach((e) => seen.push(e.kind))))
    vi.advanceTimersByTime(30_000)
    expect(seen).toContain('arrival')
  })
})
