import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { createSession } from '@/features/session/er-engine'
import { ExamPanel } from './exam-panel'

const caseDef = requireCase('poli-hipertensi')
const session = createSession({ mode: 'poli', cases: [caseDef] })
const patient = session.patients[caseDef.id]!

const tileFor = (system: string) => screen.getAllByTestId('exam-tile')[[...new Set(caseDef.exam.map((e) => e.system))].indexOf(system as never)]!

describe('ExamPanel', () => {
  it('examines a finding from the selected system tile and flags it once revealed', async () => {
    const onExamine = vi.fn()
    const abnormal = caseDef.exam.find((e) => e.abnormal)!
    const { rerender } = render(<ExamPanel caseDef={caseDef} patient={patient} onExamine={onExamine} />)
    await userEvent.click(tileFor(abnormal.system))
    await userEvent.click(within(screen.getByTestId('exam-detail')).getByRole('button', { name: new RegExp(abnormal.label.slice(0, 12)) }))
    expect(onExamine).toHaveBeenCalledWith(abnormal.id)

    const seen = { ...patient, log: { ...patient.log, exams: [{ id: abnormal.id, atSec: 1 }] } }
    rerender(<ExamPanel caseDef={caseDef} patient={seen} onExamine={onExamine} />)
    const detail = screen.getByTestId('exam-detail')
    expect(within(detail).getByText(abnormal.finding)).toBeInTheDocument()
    expect(within(detail).getByText('Abnormal')).toBeInTheDocument()
  })

  it('marks a normal finding with a Normal chip', async () => {
    const normal = caseDef.exam.find((e) => !e.abnormal)!
    const seen = { ...patient, log: { ...patient.log, exams: [{ id: normal.id, atSec: 1 }] } }
    render(<ExamPanel caseDef={caseDef} patient={seen} onExamine={vi.fn()} />)
    await userEvent.click(tileFor(normal.system))
    expect(within(screen.getByTestId('exam-detail')).getAllByText('Normal').length).toBeGreaterThan(0)
  })
})
