import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { createSession } from '@/features/session/er-engine'
import type { SessionPatient } from '@/features/session/types'
import { TreatmentPanel } from './treatment-panel'

const caseDef = requireCase('poli-hipertensi')
const session = createSession({ mode: 'poli', cases: [caseDef] })
const base = session.patients[caseDef.id]!
const diagnosed = { ...base, log: { ...base.log, diagnosisId: caseDef.correctDiagnosisId } }
const drug = caseDef.treatments.find((t) => t.category === 'obat')!

const show = (patient: SessionPatient = diagnosed) => {
  const onTreat = vi.fn()
  render(<TreatmentPanel caseDef={caseDef} mode="poli" patient={patient} onTreat={onTreat} onDispose={vi.fn()} />)
  return onTreat
}

describe('TreatmentPanel', () => {
  it('locks prescribing until a diagnosis is committed', () => {
    show(base)
    expect(screen.getByTestId('rx-locked')).toBeInTheDocument()
    expect(screen.queryByTestId('rx-pad')).toBeNull()
  })

  it('adds a drug to the pad, edits its dose, and signs it with that dose', async () => {
    const onTreat = show()
    expect(screen.getByRole('button', { name: /Tanda tangani resep/ })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: `Tambah ke resep: ${drug.name}` }))
    const dose = within(screen.getByTestId('rx-line')).getByLabelText('Dosis')
    await userEvent.clear(dose)
    await userEvent.type(dose, '10 mg 1x1')
    await userEvent.click(screen.getByRole('button', { name: /Tanda tangani resep \(1\)/ }))
    expect(onTreat).toHaveBeenCalledWith(drug.id, { dose: '10 mg 1x1', duration: drug.defaultDuration })
  })

  it('removes a drug from the pad without treating', async () => {
    const onTreat = show()
    await userEvent.click(screen.getByRole('button', { name: `Tambah ke resep: ${drug.name}` }))
    await userEvent.click(screen.getByRole('button', { name: `Hapus dari resep: ${drug.name}` }))
    expect(screen.queryByTestId('rx-line')).toBeNull()
    expect(screen.getByTestId('rx-pad-empty')).toBeInTheDocument()
    expect(onTreat).not.toHaveBeenCalled()
  })
})
