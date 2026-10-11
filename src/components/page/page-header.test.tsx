import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './page-header'

describe('PageHeader', () => {
  it('renders title, one-line description and the toolbar slot in that order', () => {
    render(<PageHeader title="Kasus" description="Pilih kasus." toolbar={<input aria-label="Cari" />} />)
    const text = document.querySelector('[data-slot="page-header"]')?.textContent
    expect(screen.getByRole('heading', { level: 1, name: 'Kasus' })).toBeInTheDocument()
    expect(text?.indexOf('Kasus')).toBeLessThan(text?.indexOf('Pilih kasus.') ?? -1)
    expect(screen.getByLabelText('Cari').closest('[data-slot="page-toolbar"]')).not.toBeNull()
  })

  it('omits the toolbar wrapper when none is given', () => {
    render(<PageHeader title="Kasus" />)
    expect(document.querySelector('[data-slot="page-toolbar"]')).toBeNull()
  })
})
