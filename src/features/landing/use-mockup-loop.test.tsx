import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCKUP_DWELL_MS } from './mockup-machine'
import { useMockupLoop } from './use-mockup-loop'

const flags = vi.hoisted(() => ({ visible: true, reduced: false }))
vi.mock('@/lib/motion', () => ({
  usePauseOffscreen: () => flags.visible,
  useReducedMotion: () => flags.reduced,
}))

beforeEach(() => {
  vi.useFakeTimers()
  flags.visible = true
  flags.reduced = false
})
afterEach(() => vi.useRealTimers())

const ref = { current: null }

describe('useMockupLoop', () => {
  it('advances one state per dwell while on screen', () => {
    const { result } = renderHook(() => useMockupLoop(ref))
    expect(result.current.state).toBe('brief')
    act(() => void vi.advanceTimersByTime(MOCKUP_DWELL_MS))
    expect(result.current.state).toBe('anamnesis')
    act(() => void vi.advanceTimersByTime(MOCKUP_DWELL_MS))
    expect(result.current.state).toBe('lab')
  })

  it('stays put offscreen, under reduced motion, and while held', () => {
    flags.visible = false
    const off = renderHook(() => useMockupLoop(ref))
    act(() => void vi.advanceTimersByTime(MOCKUP_DWELL_MS * 3))
    expect(off.result.current.state).toBe('brief')

    flags.visible = true
    flags.reduced = true
    const calm = renderHook(() => useMockupLoop(ref))
    act(() => void vi.advanceTimersByTime(MOCKUP_DWELL_MS * 3))
    expect(calm.result.current.state).toBe('brief')

    flags.reduced = false
    const held = renderHook(() => useMockupLoop(ref))
    act(() => held.result.current.hold(true))
    act(() => void vi.advanceTimersByTime(MOCKUP_DWELL_MS * 3))
    expect(held.result.current.state).toBe('brief')
  })

  it('lets a step be chosen directly and keeps looping from there', () => {
    const { result } = renderHook(() => useMockupLoop(ref))
    act(() => result.current.select('lab'))
    expect(result.current.state).toBe('lab')
    act(() => void vi.advanceTimersByTime(MOCKUP_DWELL_MS))
    expect(result.current.state).toBe('debrief')
  })
})
