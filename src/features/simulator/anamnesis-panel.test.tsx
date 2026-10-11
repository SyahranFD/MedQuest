import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { buildQuestionCatalogue } from '@/features/dialogue'
import { createSession } from '@/features/session/er-engine'
import { AnamnesisPanel, unusedQuestions } from './anamnesis-panel'

const caseDef = requireCase('poli-hipertensi')
const session = createSession({ mode: 'poli', cases: [caseDef] })
const patient = session.patients[caseDef.id]!
const flat = buildQuestionCatalogue(caseDef).flatMap((g) => g.questions)

describe('AnamnesisPanel', () => {
  it('sends the clicked question over onAsk and leaves digit keys to the dock', async () => {
    const onAsk = vi.fn()
    render(<AnamnesisPanel caseDef={caseDef} patient={patient} onAsk={onAsk} onSend={vi.fn()} />)
    await userEvent.keyboard('2')
    expect(onAsk).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: new RegExp(flat[1]!.question.slice(0, 20)) }))
    expect(onAsk).toHaveBeenCalledWith(flat[1]!.id)
  })

  it('marks asked questions as asked, disables them and counts them', () => {
    const asked = { ...patient, log: { ...patient.log, askedIds: [{ id: flat[0]!.id, atSec: 1, via: 'click' as const }] } }
    render(<AnamnesisPanel caseDef={caseDef} patient={asked} onAsk={vi.fn()} onSend={vi.fn()} />)
    expect(unusedQuestions(buildQuestionCatalogue(caseDef), [flat[0]!.id])[0]!.id).toBe(flat[1]!.id)
    expect(screen.getByText('Sudah ditanyakan').closest('button')).toBeDisabled()
    expect(screen.getByTestId('question-counter')).toHaveTextContent(`1 dari ${flat.length}`)
  })

  it('sends typed text on Enter and quick phrases on click', async () => {
    const onSend = vi.fn()
    render(<AnamnesisPanel caseDef={caseDef} patient={patient} onAsk={vi.fn()} onSend={onSend} />)
    await userEvent.type(screen.getByRole('textbox'), '3 hari{Enter}')
    expect(onSend).toHaveBeenCalledWith('3 hari')
    await userEvent.click(screen.getByRole('button', { name: /Tenang ya/ }))
    expect(onSend).toHaveBeenCalledWith('Tenang ya, kami akan bantu sebaik mungkin.')
  })
})
