import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { createSession, orderTest } from '@/features/session/er-engine'
import { OrdersPanel } from './orders-panel'

const caseDef = requireCase('poli-hipertensi')
const base = createSession({ mode: 'poli', cases: [caseDef] })
const lab = caseDef.tests.find((t) => t.category === 'lab' && t.results[0]!.abnormal)!

function show(session = base) {
  const handlers = { onOrder: vi.fn(), onOrderPanel: vi.fn(), onMarkSeen: vi.fn() }
  render(<OrdersPanel caseDef={caseDef} session={session} patient={session.patients[caseDef.id]!} {...handlers} />)
  return handlers
}

describe('OrdersPanel', () => {
  it('orders a single test and a whole bundle through the existing callbacks', async () => {
    const h = show()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(lab.name.slice(0, 15)) }))
    expect(h.onOrder).toHaveBeenCalledWith(lab.testId)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(caseDef.panels[0]!.label) }))
    expect(h.onOrderPanel).toHaveBeenCalledWith(caseDef.panels[0]!.testIds)
  })

  it('filters the catalogue by the search box and hides the bundle card while searching', async () => {
    show()
    const box = screen.getByRole('searchbox')
    await userEvent.type(box, 'zzzz-tidak-ada')
    expect(screen.queryByRole('list', { name: 'Paket pemeriksaan' })).toBeNull()
    expect(screen.queryByRole('button', { name: new RegExp(lab.name.slice(0, 15)) })).toBeNull()
    await userEvent.clear(box)
    await userEvent.type(box, lab.name.slice(0, 6))
    expect(screen.getAllByRole('button', { name: new RegExp(lab.name.slice(0, 6), 'i') }).length).toBeGreaterThan(0)
  })

  it('shows an ordered test as checked and disabled, and its result with a flag in the table', () => {
    const { session } = orderTest(base, caseDef.id, lab.testId, (id) => requireCase(id))
    show(session)
    expect(screen.getByTestId('order-count')).toHaveTextContent('1 dipesan')
    expect(screen.getByRole('button', { name: /Dipesan/ })).toBeDisabled()
    const row = screen.getByTestId('result-card')
    expect(within(row).getByRole('rowheader')).toHaveTextContent(lab.name)
    expect(row.querySelectorAll('[data-slot="badge"]')).toHaveLength(1)
  })
})
