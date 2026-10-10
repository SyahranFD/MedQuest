import { useSyncExternalStore } from 'react'
import { useUiStore } from '@/stores/ui'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

const getSnapshot = () => window.matchMedia(QUERY).matches
const getServerSnapshot = () => false

/** True when the OS asks for reduced motion, unless the user overrode it in the UI store. */
export function useReducedMotion(): boolean {
  const system = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const pref = useUiStore((s) => s.reducedMotion)
  return pref === 'system' ? system : pref === 'reduce'
}
