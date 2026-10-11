import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { createSession } from '@/features/session/er-engine'
import { DiagnosisPanel } from './diagnosis-panel'

const caseDef = requireCase('poli-hipertensi')
const session = createSession({ mode: 'poli', cases: [caseDef] })
const patient = session.patients[caseDef.id]!

describe('DiagnosisPanel', () => {
  it('keeps the commit button disabled until a main diagnosis is picked, then commits that id', async () => {
    const onCommit = vi.fn()
    render(<DiagnosisPanel caseDef={caseDef} patient={patient} onCommit={onCommit} />)
    const commit = screen.getByRole('button', { name: 'Tetapkan diagnosis' })
    expect(commit).toBeDisabled()
    expect(screen.getByTestId('dx-summary')).toHaveTextContent('Diagnosis utama belum dipilih')
    const target = caseDef.diagnoses[1]!
    await userEvent.click(screen.getByRole('radio', { name: target.label }))
    expect(screen.getByRole('radio', { name: target.label })).toBeChecked()
    expect(screen.getByTestId('dx-summary')).toHaveTextContent(target.label)
    expect(commit).toBeEnabled()
    await userEvent.click(commit)
    expect(onCommit).toHaveBeenCalledWith(target.id)
  })

  it('counts the differentials and excludes the main pick from them', async () => {
    render(<DiagnosisPanel caseDef={caseDef} patient={patient} onCommit={vi.fn()} />)
    const [main, a, b] = caseDef.diagnoses
    await userEvent.click(screen.getByRole('radio', { name: main!.label }))
    expect(screen.queryByRole('button', { name: main!.label })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: a!.label }))
    await userEvent.click(screen.getByRole('button', { name: b!.label }))
    expect(screen.getByTestId('dx-differential-count')).toHaveTextContent('2 dipilih')
  })

  it('does not render the training-tool disclaimer', () => {
    render(<DiagnosisPanel caseDef={caseDef} patient={patient} onCommit={vi.fn()} />)
    expect(screen.queryByText(/bukan alat keputusan klinis/i)).toBeNull()
  })
})
