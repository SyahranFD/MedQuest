import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function Demo({ variant }: { variant?: 'segmented' | 'underline' }) {
  return (
    <Tabs defaultValue="a" variant={variant}>
      <TabsList>
        <TabsTrigger value="a">Satu</TabsTrigger>
        <TabsTrigger value="b">Dua</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Isi satu</TabsContent>
      <TabsContent value="b">Isi dua</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('switches the visible panel in both variants', async () => {
    for (const variant of ['segmented', 'underline'] as const) {
      const { unmount } = render(<Demo variant={variant} />)
      await userEvent.click(screen.getByRole('tab', { name: 'Dua' }))
      expect(screen.getByText('Isi dua')).toBeVisible()
      unmount()
    }
  })

  it('draws the underline variant as a hairline list with an underlined active tab', () => {
    render(<Demo variant="underline" />)
    expect(screen.getByRole('tablist').className).toContain('border-b')
    expect(screen.getByRole('tab', { name: 'Satu' }).className).toContain('data-[state=active]:border-ink-1')
  })

  it('stays segmented by default', () => {
    render(<Demo />)
    expect(screen.getByRole('tablist').className).toContain('rounded-sm')
  })

  it('only points aria-controls at a panel when the tab owns one', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Filter</TabsTrigger>
          <TabsTrigger value="b" controlled>
            Panel
          </TabsTrigger>
        </TabsList>
        <TabsContent value="b">Isi</TabsContent>
      </Tabs>,
    )
    expect(screen.getByRole('tab', { name: 'Filter' })).not.toHaveAttribute('aria-controls')
    expect(screen.getByRole('tab', { name: 'Panel' })).toHaveAttribute('aria-controls')
  })
})
