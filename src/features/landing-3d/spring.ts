export interface SpringState {
  x: number
  v: number
}

/**
 * Exact step of a critically damped spring (damping ratio 1, no overshoot).
 * `omega` is the natural frequency in rad/s; settle time is about 4 / omega.
 */
export function criticalSpringStep(state: SpringState, target: number, omega: number, dt: number): SpringState {
  const c1 = state.x - target
  const c2 = state.v + omega * c1
  const decay = Math.exp(-omega * dt)
  return { x: target + (c1 + c2 * dt) * decay, v: (c2 - omega * (c1 + c2 * dt)) * decay }
}

/** Apple "response" (seconds to roughly settle) to natural frequency. */
export const omegaFromResponse = (response: number) => (Math.PI * 2) / response
