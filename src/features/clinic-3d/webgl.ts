let cached: boolean | null = null

/** True when a WebGL context can be created. Cheap, cached, and free of three.js. */
export function hasWebGL(): boolean {
  if (cached !== null) return cached
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    cached = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}
