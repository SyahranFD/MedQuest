import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createQueryClient } from '@/lib/query'
import { useUiStore } from '@/stores/ui'
import { ALL_CASES } from '@/features/cases/data'
import { caseCategory } from '@/features/cases/card-meta'
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

const total = ALL_CASES.length
const erTotal = ALL_CASES.filter((c) => c.mode === 'er').length
const cardioTotal = ALL_CASES.filter((c) => caseCategory(c) === 'cardio').length
const cards = () => screen.queryAllByRole('link')

beforeEach(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  useUiStore.setState({ locale: 'id', reducedMotion: 'reduce' })
})

describe('/app/kasus', () => {
  it('has one main, one h1 and a folder link per case', async () => {
    await renderLibrary()
    expect(screen.getByRole('heading', { level: 1, name: 'Kasus' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    await waitFor(() => expect(cards()).toHaveLength(total))
  })

  it('shows specialty and difficulty as plain text with no status chips', async () => {
    await renderLibrary()
    await waitFor(() => expect(cards()).toHaveLength(total))
    expect(document.querySelectorAll('[data-slot="badge"]')).toHaveLength(0)
    expect(screen.queryByText('Selesai')).toBeNull()
    expect(screen.queryByText('Kritis')).toBeNull()
    expect(screen.getAllByText(/· Laki-laki$/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/· Perempuan$/).length).toBeGreaterThan(0)
  })

  it('filters by mode, specialty and search, with an empty state', async () => {
    await renderLibrary()
    await waitFor(() => expect(cards()).toHaveLength(total))
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByRole('tab', { name: 'IGD' }))
    expect(cards()).toHaveLength(erTotal)
    expect(screen.getByText(`${erTotal} dari ${total} kasus`)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Semua' }))
    await user.click(screen.getByRole('combobox', { name: 'Spesialisasi' }))
    await user.click(screen.getByRole('option', { name: 'Kardiovaskular' }))
    expect(cards()).toHaveLength(cardioTotal)
    await user.click(screen.getByRole('combobox', { name: 'Spesialisasi' }))
    await user.click(screen.getByRole('option', { name: 'Semua spesialisasi' }))
    await user.click(screen.getByRole('combobox', { name: 'Tingkat kesulitan' }))
    await user.click(screen.getByRole('option', { name: 'Sulit' }))
    expect(cards().length).toBeLessThan(total)
    await user.click(screen.getAllByRole('button', { name: 'Hapus filter' })[0]!)
    await user.type(screen.getByLabelText('Cari kasus'), 'zzzz')
    expect(screen.getByText('Tidak ada kasus yang cocok')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Hapus filter' })[0]!)
    expect(cards()).toHaveLength(total)
  })
})
