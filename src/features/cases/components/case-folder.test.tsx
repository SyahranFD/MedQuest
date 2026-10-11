import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUiStore } from '@/stores/ui'
import { ALL_CASES } from '../data'
import { acsCase } from '../data/acs'
import { dengueCase } from '../data/dengue'
import { CaseFolderGrid } from './case-folder'
import { PatientAvatar } from './patient-avatar'

async function renderGrid() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <CaseFolderGrid cases={ALL_CASES} /> }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
}

beforeEach(() => {
  useUiStore.setState({ locale: 'id', reducedMotion: 'full' })
})

describe('CaseFolder', () => {
  it('shows patient name, age with gender word, occupation, specialty and mode, and no chips', async () => {
    await renderGrid()
    const hartono = screen.getByRole('link', { name: acsCase.title })
    expect(hartono).toHaveAttribute('href', `/app/kasus/${acsCase.id}`)
    expect(within(hartono).getByText('Hartono Wijaya')).toBeInTheDocument()
    expect(within(hartono).getByText('58 · Laki-laki')).toBeInTheDocument()
    expect(within(hartono).getByText('Pedagang')).toBeInTheDocument()
    expect(within(hartono).getByText('Kardiovaskular')).toBeInTheDocument()
    expect(within(hartono).getByText('IGD')).toBeInTheDocument()
    const sari = screen.getByRole('link', { name: dengueCase.title })
    expect(within(sari).getByText('26 · Perempuan')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="badge"]')).toHaveLength(0)
    expect(screen.getAllByTestId('case-folder')).toHaveLength(ALL_CASES.length)
  })

  it('shows the case title as plain text on the folder front', async () => {
    await renderGrid()
    const hartono = screen.getByRole('link', { name: acsCase.title })
    const title = within(hartono).getByTestId('case-folder-title')
    expect(title).toHaveTextContent(acsCase.title)
    expect(title.className).not.toContain('bg-')
  })

  it('writes Male and Female in English', async () => {
    useUiStore.setState({ locale: 'en' })
    await renderGrid()
    expect(screen.getByText('58 · Male')).toBeInTheDocument()
    expect(screen.getByText('26 · Female')).toBeInTheDocument()
    expect(screen.getAllByText('ER').length).toBeGreaterThan(0)
  })

  it('lifts the ID card on hover and focus, but not under reduced motion', async () => {
    await renderGrid()
    expect(screen.getAllByTestId('case-folder-paper')[0]!.className).toContain('group-hover/folder:-translate-y-4')
    await act(async () => useUiStore.setState({ reducedMotion: 'reduce' }))
    const paper = screen.getAllByTestId('case-folder-paper')[0]!
    expect(paper.className).not.toMatch(/translate|transition/)
  })
})

describe('PatientAvatar', () => {
  const render1 = (seed: string, patient = acsCase.patient) => {
    const { container, unmount } = render(<PatientAvatar patient={patient} seed={seed} />)
    const html = container.innerHTML
    unmount()
    return html
  }

  it('is identical for the same case and varies across cases', () => {
    expect(render1(acsCase.id)).toBe(render1(acsCase.id))
    const all = new Set(ALL_CASES.map((c) => render1(c.id, c.patient)))
    expect(all.size).toBe(ALL_CASES.length)
  })

  it('gives women a hijab most of the time and keeps colors as tokens', () => {
    const styles = ALL_CASES.filter((c) => c.patient.gender === 'F').map((c) => {
      const { container, unmount } = render(<PatientAvatar patient={c.patient} seed={c.id} />)
      const style = container.querySelector('svg')!.dataset.style
      expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}/i)
      unmount()
      return style
    })
    expect(styles).toContain('hijab')
  })
})
