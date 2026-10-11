import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Vitals } from '@/features/cases/types'
import { VitalsGrid } from './vitals-grid'

const OK: Vitals = { hr: 80, sbp: 120, dbp: 80, rr: 16, spo2: 98, temp: 36.8, gcs: 15 }

describe('VitalsGrid', () => {
  it('shows no chip when every vital is normal', () => {
    render(<VitalsGrid vitals={OK} />)
    expect(screen.getByTestId('vitals-grid').querySelectorAll('[data-slot="badge"]')).toHaveLength(0)
  })

  it('shows a condition chip only on the abnormal vital, in its own colour', () => {
    render(<VitalsGrid vitals={{ ...OK, hr: 120, spo2: 93, sbp: 85 }} />)
    const grid = screen.getByTestId('vitals-grid')
    const chips = [...grid.querySelectorAll('[data-slot="badge"]')].map((c) => c.textContent)
    expect(chips).toEqual(['Takikardia', 'Hipotensi', 'Rendah ringan'])
    expect(within(grid).getByText('Takikardia').className).toContain('bg-chip-danger')
    expect(within(grid).getByText('Hipotensi').className).toContain('bg-chip-info')
    expect(within(grid).getByText('Rendah ringan').className).toContain('bg-chip-warning')
  })
})
