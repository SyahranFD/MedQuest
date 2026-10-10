import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { listSessionResults, saveSessionResult, STORAGE_KEY } from '@/features/session/repository'
import { createDemoRecords } from '@/features/session/demo-history'
import { createQueryClient } from '@/lib/query'
import { useUiStore } from '@/stores/ui'
import { HistoryPage } from './history-page'

async function renderHistory() {
  const router = createRouter({
    routeTree: createRootRoute({ component: HistoryPage }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await act(async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    await router.load()
  })
}

const rowCount = () => screen.queryAllByRole('button', { name: /^Buka rincian/ }).length
const demoRows = createDemoRecords().flatMap((r) => r.evaluations).length

beforeEach(() => {
  useUiStore.setState({ locale: 'id', reducedMotion: 'reduce' })
})

describe('/app/riwayat', () => {
  it('shows one main, one h1, personal stats and a row per graded case', async () => {
    await renderHistory()
    expect(await screen.findByRole('heading', { level: 1, name: 'Riwayat' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    await waitFor(() => expect(rowCount()).toBe(demoRows))
    expect(screen.getByRole('heading', { level: 2, name: 'Rerata per dimensi' })).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(6)
  })

  it('filters by mode and result, and shows an empty state', async () => {
    await renderHistory()
    await waitFor(() => expect(rowCount()).toBe(demoRows))
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByRole('button', { name: 'Poliklinik' }))
    expect(rowCount()).toBe(3)
    await user.click(screen.getByRole('button', { name: 'Perlu diulang' }))
    expect(rowCount()).toBeLessThan(3)
    await user.click(screen.getByRole('button', { name: 'ER' }))
    await user.click(screen.getByRole('button', { name: 'Lulus atau lebih' }))
    expect(rowCount()).toBeGreaterThan(0)
  })

  it('opens a detail dialog with a debrief link', async () => {
    await renderHistory()
    await waitFor(() => expect(rowCount()).toBe(demoRows))
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getAllByRole('button', { name: /^Buka rincian/ })[0]!)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('link', { name: /Buka debrief lengkap/ })).toBeInTheDocument()
  })

  it('shows an empty state when there is no history', async () => {
    localStorage.setItem(STORAGE_KEY, '[]')
    await renderHistory()
    expect(await screen.findByText('Belum ada riwayat')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pilih kasus' })).toBeInTheDocument()
  })

  it('resets demo data after confirmation', { timeout: 20_000 }, async () => {
    await listSessionResults()
    const extra = createDemoRecords()[0]!
    await saveSessionResult({ ...extra, id: 'mine', demo: false })
    await renderHistory()
    await waitFor(() => expect(rowCount()).toBe(demoRows + 1))
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByRole('button', { name: 'Reset data demo' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(rowCount()).toBe(demoRows))
  })
})
