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

describe('AnamnesisPanel keyboard', () => {
  it('number keys pick the nth unused question', async () => {
    const onAsk = vi.fn()
    render(<AnamnesisPanel caseDef={caseDef} patient={patient} onAsk={onAsk} onSend={vi.fn()} />)
    await userEvent.keyboard('2')
    expect(onAsk).toHaveBeenCalledWith(flat[1]!.id)
  })

  it('skips questions already asked and counts them', async () => {
    const onAsk = vi.fn()
    const asked = { ...patient, log: { ...patient.log, askedIds: [{ id: flat[0]!.id, atSec: 1, via: 'click' as const }] } }
    render(<AnamnesisPanel caseDef={caseDef} patient={asked} onAsk={onAsk} onSend={vi.fn()} />)
    expect(unusedQuestions(buildQuestionCatalogue(caseDef), [flat[0]!.id])[0]!.id).toBe(flat[1]!.id)
    await userEvent.keyboard('1')
    expect(onAsk).toHaveBeenCalledWith(flat[1]!.id)
    expect(screen.getByTestId('question-counter')).toHaveTextContent(`1 dari ${flat.length}`)
  })

  it('ignores digits typed into the text box and sends on Enter', async () => {
    const onAsk = vi.fn()
    const onSend = vi.fn()
    render(<AnamnesisPanel caseDef={caseDef} patient={patient} onAsk={onAsk} onSend={onSend} />)
    await userEvent.type(screen.getByRole('textbox'), '3 hari{Enter}')
    expect(onAsk).not.toHaveBeenCalled()
    expect(onSend).toHaveBeenCalledWith('3 hari')
  })
})
