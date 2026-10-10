import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrustHud } from './trust-hud'

describe('TrustHud', () => {
  it('shows label, mood word, percent and the signed delta with its reason', () => {
    render(<TrustHud trust={62.4} mood="lega" talking={false} feedback={{ seq: 1, delta: 5, reason: 'empatik', tint: 'good' }} />)
    expect(screen.getByText('Kepercayaan pasien', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByTestId('mood-badge')).toHaveTextContent('Lega')
    expect(screen.getByTestId('trust-percent')).toHaveTextContent('62%')
    expect(screen.getByTestId('trust-delta')).toHaveTextContent('+5')
    expect(screen.getByTestId('trust-reason')).toHaveTextContent('empatik')
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '62')
  })

  it('marks the audio strip while the patient talks', () => {
    const { container } = render(<TrustHud trust={50} mood="netral" talking />)
    expect(container.querySelector('[data-talking="true"]')).not.toBeNull()
  })
})
