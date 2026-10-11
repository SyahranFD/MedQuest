import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Badge } from './badge'
import { Button } from './button'
import { Progress } from './progress'

describe('Button', () => {
  it('fires onClick and exposes data-slot', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Simpan</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button')
  })

  it('renders the child element with asChild', () => {
    render(
      <Button asChild>
        <a href="/app">Coba demo</a>
      </Button>,
    )
    expect(screen.getByRole('link', { name: 'Coba demo' })).toHaveAttribute('href', '/app')
  })

  it('does not fire when disabled', async () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Simpan</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Badge', () => {
  it('uses solid status classes and never a tonal pair', () => {
    render(<Badge variant="danger">Kritis</Badge>)
    const cls = screen.getByText('Kritis').className
    expect(cls).toContain('bg-chip-danger')
    expect(cls).toContain('text-chip-danger-ink')
  })

  it('gives info its own bright blue fill', () => {
    render(<Badge variant="info">Lulus</Badge>)
    expect(screen.getByText('Lulus').className).toContain('bg-chip-info')
  })

  it('maps a category to its bright chip fill', () => {
    render(<Badge variant="category" category="cardio">Kardio</Badge>)
    expect(screen.getByText('Kardio').className).toContain('bg-chip-cardio')
  })
})

describe('Progress', () => {
  it('clamps the value', () => {
    render(<Progress value={180} aria-label="p" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })
})
