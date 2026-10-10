/** States of the looping product mockup (CLAUDE.md 8.3 E3). One state per "how it works" step. */
export const MOCKUP_STATES = ['brief', 'anamnesis', 'lab', 'debrief'] as const
export type MockupState = (typeof MOCKUP_STATES)[number]

/** Dwell time per state, about 3s (phantom.md pattern 5). */
export const MOCKUP_DWELL_MS = 3200

export function nextState(state: MockupState): MockupState {
  const i = MOCKUP_STATES.indexOf(state)
  return MOCKUP_STATES[(i + 1) % MOCKUP_STATES.length]!
}

export function stateIndex(state: MockupState): number {
  return MOCKUP_STATES.indexOf(state)
}
