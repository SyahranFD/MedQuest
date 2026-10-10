import { createContext, useContext } from 'react'
import { CLAY_FALLBACK, type ClayPalette } from '@/lib/clay-palette'
import type { ClayQuality } from './budget'

export interface ClayRuntime {
  palette: ClayPalette
  quality: ClayQuality
  /** True while frames should run: in view, tab visible, motion allowed. */
  active: boolean
  reduced: boolean
}

export const ClayContext = createContext<ClayRuntime>({
  palette: CLAY_FALLBACK,
  quality: 'high',
  active: false,
  reduced: true,
})

export const useClay = () => useContext(ClayContext)
