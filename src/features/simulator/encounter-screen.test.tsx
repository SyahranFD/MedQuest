import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { buildQuestionCatalogue } from '@/features/dialogue'
import { useSessionStore } from '@/features/session/store'
import { useUiStore } from '@/stores/ui'
import { EncounterScreen } from './encounter-screen'

vi.mock('@/features/clinic-3d', () => ({
  ClinicSceneLazy: ({ patients, onSelectPatient }: { patients: { id: string }[]; onSelectPatient: (id: string) => void }) => (
    <div>
      {patients.map((p) => (
        <button key={p.id} type="button" aria-label={`Pilih pasien ${p.id}`} onClick={() => onSelectPatient(p.id)} />
      ))}
    </div>
  ),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: ReactNode }) => <a href="/">{children}</a>,
}))

const render = (ui: ReactNode) => rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

const caseDef = requireCase('poli-hipertensi')
const firstQuestion = buildQuestionCatalogue(caseDef)[0]!.questions[0]!

function start() {
  const store = useSessionStore.getState()
  const session = store.startSession({ mode: 'poli', caseIds: [caseDef.id], id: 'hud-test' })
  store.selectPatient(caseDef.id)
  return session.id
}

const dock = () => screen.getByRole('navigation', { name: 'Alat periksa' })
const dockButton = (name: string) => within(dock()).getByRole('button', { name })

beforeEach(() => {
  localStorage.setItem('mq-hud-hint', '1')
  start()
})
afterEach(() => {
  useSessionStore.getState().reset()
  useUiStore.setState({ reducedMotion: 'system' })
})

describe('encounter HUD', () => {
  it('starts with the tablet closed and the dock showing five tools', () => {
    render(<EncounterScreen sessionId="hud-test" />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(within(dock()).getAllByRole('button')).toHaveLength(5)
    expect(dockButton('Anamnesis')).toHaveAttribute('aria-keyshortcuts', '1')
  })

  it('opens the tablet from a dock button with Enter and closes with Esc, returning focus', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    dockButton('Lab').focus()
    await user.keyboard('{Enter}')
    const tablet = await screen.findByRole('dialog', { name: 'Tablet dokter' })
    expect(within(tablet).getByRole('tab', { name: /Lab/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(dockButton('Lab')).toHaveFocus()
  })

  it.each([
    ['1', /Anamnesis/],
    ['2', /Periksa/],
    ['3', /Lab/],
    ['4', /Diagnosis/],
    ['5', /Terapi/],
  ])('key %s opens the matching tab', async (key, name) => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.keyboard(key)
    const tablet = await screen.findByRole('dialog')
    expect(within(tablet).getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true')
  })

  it('pressing the open tab key again closes the tablet', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.keyboard('1')
    await screen.findByRole('dialog')
    await user.keyboard('1')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('a clicked question goes through the session store and shows as asked', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.click(dockButton('Anamnesis'))
    const tablet = await screen.findByRole('dialog')
    await user.click(within(tablet).getByRole('button', { name: new RegExp(firstQuestion.question.slice(0, 20)) }))
    const patient = useSessionStore.getState().session!.patients[caseDef.id]!
    expect(patient.log.askedIds.map((a) => a.id)).toContain(firstQuestion.id)
    expect(within(tablet).getByText('Sudah ditanyakan').closest('button')).toBeDisabled()
  })

  it('under reduced motion the tablet still opens and closes, fading only', async () => {
    useUiStore.setState({ reducedMotion: 'reduce' })
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.keyboard('4')
    const tablet = await screen.findByRole('dialog')
    expect(tablet.style.transform).not.toMatch(/translate|scale\(0\.7/)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('arrow keys, Home and End move between the segments and switch the tab', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.keyboard('1')
    const tablet = await screen.findByRole('dialog')
    expect(within(tablet).getAllByTestId('tablet-thumb')).toHaveLength(1)
    within(tablet).getByRole('tab', { name: /Anamnesis/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(within(tablet).getByRole('tab', { name: /Periksa/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{End}')
    expect(within(tablet).getByRole('tab', { name: /Terapi/ })).toHaveFocus()
    expect(within(tablet).getByRole('tab', { name: /Terapi/ })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Home}')
    expect(within(tablet).getByRole('tab', { name: /Anamnesis/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(tablet).getAllByTestId('tablet-thumb')).toHaveLength(1)
  })

  it('the toolbar names the patient', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.keyboard('1')
    expect(await screen.findByTestId('tablet-title')).toHaveTextContent(`${caseDef.patient.name}, ${caseDef.patient.age}`)
  })

  it('a poli patient press opens the tablet on Periksa', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.click(screen.getByRole('button', { name: `Pilih pasien ${caseDef.id}` }))
    const tablet = await screen.findByRole('dialog')
    expect(within(tablet).getByRole('tab', { name: /Periksa/ })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('encounter HUD, ER bed flow', () => {
  const erCases = ['er-acs-stemi', 'er-dengue-dss', 'er-malaria-berat']
  let ids: string[]
  beforeEach(() => {
    useSessionStore.getState().reset()
    const session = useSessionStore.getState().startSession({ mode: 'er', caseIds: erCases, id: 'hud-er' })
    ids = session.order
    useSessionStore.getState().tick(200)
    useSessionStore.getState().selectPatient(null)
  })
  const waitingId = () => ids.find((id) => useSessionStore.getState().session!.patients[id]!.status === 'waiting')!

  it('pressing an unbedded patient opens only the bed choices, with no tablist and a disabled dock', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-er" />)
    await user.click(screen.getByRole('button', { name: `Pilih pasien ${waitingId()}` }))
    const tablet = await screen.findByRole('dialog')
    expect(within(tablet).queryByRole('tablist')).toBeNull()
    expect(within(tablet).getAllByRole('button', { name: /^Bed \d/ })).toHaveLength(3)
    expect(within(tablet).queryByText('Zona triase')).toBeNull()
    await user.keyboard('3')
    expect(within(tablet).queryByRole('tablist')).toBeNull()
    for (const b of document.querySelectorAll('[data-dock-tab]')) expect(b).toBeDisabled()
  })

  it('choosing a bed records it and switches straight to Periksa', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-er" />)
    const id = waitingId()
    await user.click(screen.getByRole('button', { name: `Pilih pasien ${id}` }))
    const tablet = await screen.findByRole('dialog')
    await user.click(within(tablet).getByRole('button', { name: /^Bed 2/ }))
    const p = useSessionStore.getState().session!.patients[id]!
    expect(p.status).toBe('in-bed')
    expect(p.bedIndex).toBe(1)
    expect(within(tablet).getByRole('tab', { name: /Periksa/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(tablet).queryByTestId('bed-placement')).toBeNull()
  })

  it('an occupied bed cannot be chosen again', async () => {
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-er" />)
    useSessionStore.getState().assignBed(ids[0]!, 0)
    const other = ids.find((id) => useSessionStore.getState().session!.patients[id]!.status === 'waiting')
    if (!other) return
    await user.click(screen.getByRole('button', { name: `Pilih pasien ${other}` }))
    const tablet = await screen.findByRole('dialog')
    expect(within(tablet).getByRole('button', { name: /^Bed 1/ })).toBeDisabled()
  })

  it('pressing a patient already in a bed opens Periksa', async () => {
    const user = userEvent.setup()
    const id = waitingId()
    useSessionStore.getState().assignBed(id, 0)
    render(<EncounterScreen sessionId="hud-er" />)
    await user.click(screen.getByRole('button', { name: `Pilih pasien ${id}` }))
    const tablet = await screen.findByRole('dialog')
    expect(within(tablet).getByRole('tab', { name: /Periksa/ })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('encounter HUD, reduced motion', () => {
  it('keeps a single thumb and swaps tabs without travelling', async () => {
    useUiStore.setState({ reducedMotion: 'reduce' })
    const user = userEvent.setup()
    render(<EncounterScreen sessionId="hud-test" />)
    await user.keyboard('1')
    const tablet = await screen.findByRole('dialog')
    within(tablet).getByRole('tab', { name: /Anamnesis/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(within(tablet).getAllByTestId('tablet-thumb')).toHaveLength(1)
    expect(within(tablet).getByRole('tab', { name: /Periksa/ })).toHaveAttribute('aria-selected', 'true')
  })
})
