import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from '@/stores/ui'
import { LandingSections } from './landing-page'

vi.mock('@/features/landing-3d', () => ({
  ClayHero: () => <div data-testid="clay-hero" />,
  ClayCluster: () => <div data-testid="clay-cluster" />,
  ClayObjectCard: () => <div data-testid="clay-card" />,
  ClayFallback: () => <div data-testid="clay-fallback" />,
}))

async function renderLanding() {
  const router = createRouter({
    routeTree: createRootRoute({ component: LandingSections }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
}

beforeEach(() => {
  useUiStore.setState({ locale: 'id', reducedMotion: 'system' })
})

describe('landing page structure', () => {
  it('has one h1 and one h2 for each of the seven other sections', async () => {
    await renderLanding()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const h2 = screen.getAllByRole('heading', { level: 2 })
    expect(h2).toHaveLength(7)
    for (const h of h2) expect(h).toHaveAccessibleName()
  })

  it('names every section region', async () => {
    await renderLanding()
    const regions = screen.getAllByRole('region')
    expect(regions.length).toBeGreaterThanOrEqual(8)
    for (const r of regions) expect(r).toHaveAccessibleName()
  })

  it('renders a single main landmark with the skip target id', async () => {
    await renderLanding()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(document.getElementById('main')).not.toBeNull()
  })

  it('offers the demo CTA and the how-it-works anchor in the hero', async () => {
    await renderLanding()
    for (const l of screen.getAllByRole('link', { name: 'Coba demo' })) expect(l).toHaveAttribute('href', '/app')
    expect(screen.getByRole('link', { name: /Lihat cara kerja/ }).getAttribute('href')).toContain('#cara-kerja')
  })

  it('uses four institution blocks, five FAQ items, and a mailto contact with no form', async () => {
    await renderLanding()
    const inst = document.getElementById('institusi')!
    expect(within(inst).getAllByRole('heading', { level: 3 })).toHaveLength(4)
    expect(within(inst).getByRole('link', { name: 'Hubungi kami' }).getAttribute('href')).toMatch(/^mailto:/)
    expect(document.querySelector('form')).toBeNull()
    expect(document.querySelectorAll('#faq details')).toHaveLength(5)
  })

  it('keeps the product mockup decorative: one text alternative, nothing focusable inside', async () => {
    await renderLanding()
    const mock = screen.getByRole('img', { name: /Contoh tampilan MedQuest/ })
    expect(mock).toHaveAttribute('aria-live', 'off')
    expect(mock.querySelector('[inert]')).not.toBeNull()
  })

  it('has no em dashes in rendered copy', async () => {
    await renderLanding()
    expect(document.body.textContent).not.toContain('—')
  })

  it('shows English copy after switching locale', async () => {
    await renderLanding()
    act(() => useUiStore.setState({ locale: 'en' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Clerkship practice')
  })
})

describe('mood picker', () => {
  it('updates the face and the patient quote on click and arrow keys', async () => {
    await renderLanding()
    const user = userEvent.setup()
    const group = screen.getByRole('radiogroup')
    expect(within(group).getAllByRole('radio')).toHaveLength(8)
    await user.click(within(group).getByRole('radio', { name: 'Marah' }))
    expect(within(group).getByRole('radio', { name: 'Marah' })).toBeChecked()
    expect(screen.getByText(/Dari tadi Dokter potong terus/)).toBeInTheDocument()
    expect(screen.getByTestId('mood-face').querySelector('svg')).toHaveAttribute('data-emotion', 'marah')
    await user.keyboard('{ArrowRight}')
    expect(within(group).getByRole('radio', { name: 'Bingung' })).toBeChecked()
    expect(screen.getByTestId('mood-face').querySelector('svg')).toHaveAttribute('data-emotion', 'bingung')
  })
})
