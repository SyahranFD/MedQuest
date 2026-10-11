import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { createQueryClient } from '@/lib/query'
import { useUiStore } from '@/stores/ui'
import { HomePage } from './home-page'

async function renderHome() {
  const router = createRouter({
    routeTree: createRootRoute({ component: HomePage }),
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

beforeEach(() => {
  useUiStore.setState({ locale: 'id', reducedMotion: 'reduce' })
})

describe('/app progress dashboard', () => {
  it('has one h1 and a single filled primary action', async () => {
    await renderHome()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const quick = screen.getByTestId('quick-start')
    expect(quick).toHaveAttribute('data-slot', 'button')
    expect(quick.className).toContain('bg-primary')
    expect(screen.queryByTestId('resume')).not.toBeInTheDocument()
  })

  it('lists each mode with its cases and no chips', async () => {
    await renderHome()
    const er = await screen.findByTestId('mode-er')
    await waitFor(() => expect(within(er).getAllByRole('link').length).toBeGreaterThan(0))
    const poli = screen.getByTestId('mode-poli')
    expect(within(er).getAllByRole('link')).toHaveLength(ALL_CASES.filter((c) => c.mode === 'er').length)
    expect(within(poli).getAllByRole('link')).toHaveLength(ALL_CASES.filter((c) => c.mode === 'poli').length)
    expect(er.querySelector('[data-slot="badge"]')).toBeNull()
    expect(within(er).getByText('Hartono Wijaya')).toBeInTheDocument()
    expect(within(poli).getByRole('heading', { name: 'Poliklinik' })).toBeInTheDocument()
    expect(within(poli).getAllByRole('link')[0]).toHaveAttribute('href', expect.stringMatching(/^\/app\/kasus\//))
  })

  it('shows the three stat cards with Rata-rata labels and no practice-focus line', async () => {
    await renderHome()
    const cards = await screen.findAllByTestId('stat-card')
    expect(cards).toHaveLength(3)
    expect(cards.map((c) => within(c).getByRole('term').textContent)).toEqual(['Sesi', 'Rata-rata skor', 'Rata-rata empati'])
    expect(screen.queryByText(/Fokus latihan/)).not.toBeInTheDocument()
  })

  it('shows each recent result with a solid verdict chip and a neutral percent', async () => {
    await renderHome()
    const recent = await screen.findByRole('region', { name: 'Hasil terbaru' })
    const rows = await within(recent).findAllByRole('link', { name: /%/ })
    expect(rows.length).toBeGreaterThan(0)
    expect(recent.querySelectorAll('[data-slot="badge"]')).toHaveLength(rows.length)
  })
})
