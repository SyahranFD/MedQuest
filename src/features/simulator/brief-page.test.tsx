import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { createQueryClient } from '@/lib/query'
import { useUiStore } from '@/stores/ui'
import { BriefPage } from './brief-page'

async function renderBrief(caseId: string) {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <BriefPage caseId={caseId} /> }),
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

describe('/app/kasus/:id brief', () => {
  it('shows the case, one start button and the synthetic notice', async () => {
    const er = ALL_CASES.find((c) => c.mode === 'er')!
    await renderBrief(er.id)
    expect(await screen.findByRole('heading', { level: 1, name: er.title })).toBeInTheDocument()
    expect(screen.getByTestId('start-case')).toHaveTextContent('Mulai shift IGD')
    expect(screen.getByTestId('synthetic-notice')).toBeInTheDocument()
    expect(screen.getByTestId('shift-mechanics')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Mulai/ })).toHaveLength(1)
  })

  it('marks abnormal vitals with a chip and leaves normal ones plain, outpatient has no shift box', async () => {
    const poli = ALL_CASES.find((c) => c.mode === 'poli')!
    await renderBrief(poli.id)
    const grid = await screen.findByTestId('vitals-grid')
    const chips = grid.querySelectorAll('[data-slot="badge"]')
    expect(chips.length).toBeLessThan(within(grid).getAllByRole('definition').length)
    expect(screen.queryByTestId('shift-mechanics')).not.toBeInTheDocument()
    expect(screen.getByTestId('start-case')).toHaveTextContent('Mulai konsultasi')
  })
})
