import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearSessionResults, getSessionResult, listSessionResults, saveSessionResult, STORAGE_KEY } from './repository'
import type { SessionRecord } from './repository'
import { createDemoRecords } from './demo-history'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('demo history', () => {
  it('is deterministic, synthetic, and spans bands and modes', () => {
    const a = createDemoRecords()
    expect(a).toEqual(createDemoRecords())
    expect(a.every((r) => r.demo)).toBe(true)
    expect(new Set(a.map((r) => r.mode))).toEqual(new Set(['er', 'poli']))
    const bands = new Set(a.flatMap((r) => r.evaluations.map((e) => e.band)))
    expect(bands.size).toBeGreaterThanOrEqual(3)
    expect(a.flatMap((r) => r.evaluations).every((e) => e.synthetic)).toBe(true)
  })
})

describe('session repository', () => {
  it('seeds demo history on the first read so the history screen is not empty', async () => {
    const list = await listSessionResults()
    expect(list.length).toBeGreaterThanOrEqual(4)
    expect(list.map((r) => r.savedAt)).toEqual([...list.map((r) => r.savedAt)].sort().reverse())
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('saves, reads back, replaces by id, and clears', async () => {
    const [first] = await listSessionResults()
    const mine: SessionRecord = { ...first, id: 'mine-1', savedAt: '2026-11-01T00:00:00.000Z', demo: undefined }
    expect(await saveSessionResult(mine)).toBe(true)
    expect((await listSessionResults())[0].id).toBe('mine-1')
    expect((await getSessionResult('mine-1'))?.evaluations[0].caseId).toBe(first.evaluations[0].caseId)
    await saveSessionResult({ ...mine, durationSec: 999 })
    expect((await listSessionResults()).filter((r) => r.id === 'mine-1')).toHaveLength(1)
    await clearSessionResults()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('drops rows that fail validation and survives malformed JSON', async () => {
    const [good] = createDemoRecords()
    localStorage.setItem(STORAGE_KEY, JSON.stringify([good, { id: 'broken', evaluations: 'nope' }, 42]))
    expect((await listSessionResults()).map((r) => r.id)).toEqual([good.id])
    localStorage.setItem(STORAGE_KEY, '{not json')
    const fallback = await listSessionResults()
    expect(fallback.length).toBeGreaterThan(0)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'an array' }))
    expect(await listSessionResults()).toEqual([])
  })

  it('does not throw when storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const list = await listSessionResults()
    expect(list.length).toBeGreaterThan(0)
    expect(await saveSessionResult(list[0])).toBe(false)
    await expect(clearSessionResults()).resolves.toBeUndefined()
  })
})
