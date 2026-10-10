import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { requireCase } from '@/features/cases/repository'
import { grade } from '@/features/grading/grade'
import { buildScriptedLog } from '@/features/grading/scripted-logs'
import { DebriefView } from './debrief-view'

const c = requireCase('er-acs-stemi')

describe('DebriefView', () => {
  it('renders a perfect run: rating, six bars, verdicts, citations, sparkline', () => {
    const log = buildScriptedLog(c, 'perfect')
    render(<DebriefView evaluation={grade(log, c)} trace={log.emotionTrace} actions={<button>Ulangi</button>} />)
    expect(screen.getByTestId('debrief-band')).toHaveTextContent('Sangat baik')
    expect(screen.getAllByRole('meter')).toHaveLength(6)
    expect(screen.queryByTestId('safety-breach')).toBeNull()
    expect(screen.getAllByTestId('criterion').every((el) => el.dataset.verdict === 'met')).toBe(true)
    expect(screen.getAllByTestId('cite-chip').length).toBeGreaterThan(0)
    expect(screen.getByTestId('trust-sparkline')).toBeInTheDocument()
    expect(screen.getByText('Ulangi')).toBeInTheDocument()
  })

  it('renders a bad run with the safety breach before the dimension bars', () => {
    const log = buildScriptedLog(c, 'bad')
    render(<DebriefView evaluation={grade(log, c)} trace={null} actions={null} />)
    const breach = screen.getByTestId('safety-breach')
    expect(within(breach).getByText('Pelanggaran keselamatan')).toBeInTheDocument()
    const firstMeter = screen.getAllByRole('meter')[0]!
    expect(breach.compareDocumentPosition(firstMeter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('debrief-band')).toHaveTextContent(/Belum lulus|Batas lulus/)
    expect(screen.getAllByTestId('criterion').some((el) => el.dataset.verdict === 'missed')).toBe(true)
    expect(screen.queryByTestId('trust-sparkline')).toBeNull()
  })
})
