import { describe, expect, it } from 'vitest'
import { MOCKUP_DWELL_MS, MOCKUP_STATES, nextState, stateIndex, type MockupState } from './mockup-machine'

describe('mockup state machine', () => {
  it('cycles brief, anamnesis, lab, debrief and wraps', () => {
    expect(MOCKUP_STATES).toEqual(['brief', 'anamnesis', 'lab', 'debrief'])
    expect(nextState('brief')).toBe('anamnesis')
    expect(nextState('anamnesis')).toBe('lab')
    expect(nextState('lab')).toBe('debrief')
    expect(nextState('debrief')).toBe('brief')
  })

  it('returns to the start after one full cycle', () => {
    let s: MockupState = MOCKUP_STATES[0]
    for (let i = 0; i < MOCKUP_STATES.length; i++) s = nextState(s)
    expect(s).toBe('brief')
  })

  it('indexes states in step order and dwells about 3 seconds', () => {
    expect(MOCKUP_STATES.map(stateIndex)).toEqual([0, 1, 2, 3])
    expect(MOCKUP_DWELL_MS).toBeGreaterThanOrEqual(3000)
    expect(MOCKUP_DWELL_MS).toBeLessThanOrEqual(3500)
  })
})
