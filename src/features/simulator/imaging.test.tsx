import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ALL_CASES } from '@/features/cases/data'
import { hasImagingRenderer, ImagingViewer } from './imaging'

const imageIds = [...new Set(ALL_CASES.flatMap((c) => c.tests.flatMap((t) => t.results.flatMap((r) => (r.imageId ? [r.imageId] : [])))))]

describe('imaging renderers', () => {
  it('finds the image ids used by the cases', () => {
    expect(imageIds.length).toBeGreaterThanOrEqual(10)
  })

  it.each(imageIds)('draws %s and labels it synthetic', (id) => {
    expect(hasImagingRenderer(id)).toBe(true)
    render(<ImagingViewer imageId={id} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.getByText(/sintetis/i)).toBeInTheDocument()
  })
})
