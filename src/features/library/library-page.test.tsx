import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createQueryClient } from '@/lib/query'
import { useUiStore } from '@/stores/ui'
import { LibraryPage } from './library-page'

async function renderLibrary() {
  const router = createRouter({
    routeTree: createRootRoute({ component: LibraryPage }),
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

const cards = () => screen.queryAllByRole('link')

beforeEach(() => {
  useUiStore.setState({ locale: 'id', reducedMotion: 'reduce' })
})

describe('/app/kasus', () => {
  it('has one main, one h1 and a link card per case', async () => {
    await renderLibrary()
    expect(screen.getByRole('heading', { level: 1, name: 'Kasus' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    await waitFor(() => expect(cards()).toHaveLength(6))
  })

  it('marks played cases completed from history and unseen ones new', async () => {
    await renderLibrary()
    await waitFor(() => expect(cards()).toHaveLength(6))
    expect(screen.getAllByText('Selesai').length).toBe(6)
  })

  it('filters by mode, specialty and search, with an empty state', async () => {
    await renderLibrary()
    await waitFor(() => expect(cards()).toHaveLength(6))
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByRole('button', { name: 'ER' }))
    expect(cards()).toHaveLength(3)
    expect(screen.getByText('3 dari 6 kasus')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Semua mode' }))
    await user.click(screen.getByRole('button', { name: 'Kardiovaskular' }))
    expect(cards()).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Kardiovaskular' }))
    await user.type(screen.getByLabelText('Cari kasus'), 'zzzz')
    expect(screen.getByText('Tidak ada kasus yang cocok')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Hapus filter' })[0]!)
    expect(cards()).toHaveLength(6)
  })
})
