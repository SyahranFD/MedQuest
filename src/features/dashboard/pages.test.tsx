import { QueryClientProvider } from '@tanstack/react-query'
import { ALL_CASES } from '@/features/cases/data'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createQueryClient } from '@/lib/query'
import { useUiStore } from '@/stores/ui'
import { ASSIGNMENTS_KEY } from './assignments'
import { CaseCataloguePage } from './case-catalogue-page'
import { OverviewPage } from './overview-page'
import { StudentDetailPage } from './student-detail-page'
import { StudentsPage } from './students-page'

async function renderPage(Page: () => React.JSX.Element) {
  const router = createRouter({
    routeTree: createRootRoute({ component: Page }),
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

describe('/dosen overview', () => {
  it('has one main and one h1, then the data panels', async () => {
    await renderPage(OverviewPage)
    expect(await screen.findByRole('heading', { level: 1, name: 'Dasbor kelas' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(await screen.findByRole('heading', { level: 2, name: 'Perlu perhatian' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 2, name: 'Kriteria yang paling sering terlewat' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Skor per kompetensi' })).toBeInTheDocument()
    expect(screen.getAllByText('Data contoh').length).toBeGreaterThan(0)
    expect(await screen.findAllByRole('meter')).toHaveLength(6)
  })

  it('offers the chart as a table and as an accessible group', async () => {
    await renderPage(OverviewPage)
    expect(await screen.findByRole('group', { name: /Grafik garis rata-rata skor kasus/ })).toBeInTheDocument()
    expect(screen.getByText('Lihat sebagai tabel')).toBeInTheDocument()
  })

  it('switches copy to English', async () => {
    useUiStore.setState({ locale: 'en' })
    await renderPage(OverviewPage)
    expect(await screen.findByRole('heading', { level: 1, name: 'Class dashboard' })).toBeInTheDocument()
  })
})

describe('/dosen/mahasiswa', () => {
  it('lists the first page, filters by search and shows an empty state', async () => {
    await renderPage(StudentsPage)
    expect(await screen.findByRole('heading', { level: 1, name: 'Mahasiswa' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(13)
    const user = userEvent.setup({ delay: null })
    await user.type(screen.getByLabelText('Cari nama atau NIM'), 'aulia')
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2))
    await user.clear(screen.getByLabelText('Cari nama atau NIM'))
    await user.type(screen.getByLabelText('Cari nama atau NIM'), 'zzzz')
    expect(await screen.findByText('Tidak ada mahasiswa yang cocok')).toBeInTheDocument()
  })

  it('sorts when a header is activated and exposes aria-sort', async () => {
    await renderPage(StudentsPage)
    const table = await screen.findByRole('table')
    const user = userEvent.setup({ delay: null })
    const header = within(table).getByRole('columnheader', { name: /Rata-rata skor/ })
    expect(header).toHaveAttribute('aria-sort', 'none')
    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    await user.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
  })

  it('filters by status chip', async () => {
    await renderPage(StudentsPage)
    await screen.findByRole('table')
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByRole('tab', { name: 'Tidak aktif' }))
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) expect(within(r).getAllByText('Tidak aktif').length).toBeGreaterThan(0)
  })
})

describe('/dosen/mahasiswa/$studentId', () => {
  it('shows the profile, a recommendation and assigns a case to localStorage', async () => {
    await renderPage(() => <StudentDetailPage studentId="s01" />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Aulia Rahmawati' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(await screen.findByText(/Dimensi terlemah Aulia Rahmawati adalah/)).toBeInTheDocument()
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByRole('button', { name: 'Beri tugas kasus' }))
    await user.click(await screen.findByRole('button', { name: 'Beri tugas' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) ?? '[]')).toHaveLength(1))
    expect(await screen.findByRole('heading', { name: 'Tugas aktif' })).toBeInTheDocument()
  })

  it('says so for an unknown student', async () => {
    await renderPage(() => <StudentDetailPage studentId="nope" />)
    expect(await screen.findByText('Mahasiswa tidak ditemukan', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})

describe('/dosen/perpustakaan', () => {
  it('lists every case with guidelines and assigns one to the class', async () => {
    await renderPage(CaseCataloguePage)
    expect(await screen.findByRole('heading', { level: 1, name: 'Perpustakaan kasus' })).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(ALL_CASES.length))
    expect(screen.getAllByText('Cek dulu sebelum dipakai').length).toBe(ALL_CASES.length)
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getAllByRole('button', { name: 'Tugaskan ke kelas' })[0]!)
    await user.click(await within(await screen.findByRole('dialog')).findByRole('button', { name: 'Tugaskan ke kelas' }))
    await waitFor(() => expect(JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) ?? '[]')[0]?.target).toBe('class'))
    expect(await screen.findByRole('button', { name: 'Sudah ditugaskan' })).toBeDisabled()
  })

  it('narrows the list by search and offers a way out when nothing matches', async () => {
    await renderPage(CaseCataloguePage)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(ALL_CASES.length))
    const user = userEvent.setup({ delay: null })
    const box = screen.getByLabelText('Cari kasus')
    await user.type(box, 'zzzz')
    expect(await screen.findByText('Tidak ada kasus yang cocok')).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Hapus pencarian' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(ALL_CASES.length))
  })
})
