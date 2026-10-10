import { useCallback, useEffect, useRef, useState } from 'react'
import type { ActionResult } from '@/features/session/types'
import { reasonKey, tintFor } from './mood'

export interface TurnFeedback {
  /** Increments per action so the HUD can replay its delta animation. */
  seq: number
  delta: number | undefined
  reason: string | null
  tint: 'good' | 'bad' | null
}

/**
 * UI side of an encounter: which patient is speaking right now (true for speakMs after a reply)
 * and the last trust change per patient. The engine owns the numbers; this owns the timing.
 */
export function useEncounterFeedback() {
  const [talkingId, setTalkingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, TurnFeedback>>({})
  const talkingRef = useRef<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const seq = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const isTalking = useCallback((patientId: string) => talkingRef.current === patientId, [])

  const apply = useCallback((result: ActionResult, opts: { interrupted?: boolean; reason?: string } = {}) => {
    if (!result.ok) return
    seq.current += 1
    const hasTrust = result.trustDelta !== undefined
    if (hasTrust) {
      setFeedback((prev) => ({
        ...prev,
        [result.patientId]: {
          seq: seq.current,
          delta: result.trustDelta,
          reason: opts.reason ?? reasonKey({ ...result, interrupted: opts.interrupted }),
          tint: tintFor(result.trustDelta),
        },
      }))
    }
    if (result.reply) {
      clearTimeout(timer.current)
      talkingRef.current = result.patientId
      setTalkingId(result.patientId)
      timer.current = setTimeout(() => {
        talkingRef.current = null
        setTalkingId(null)
      }, result.speakMs ?? 1200)
    }
  }, [])

  return { talkingId, feedback, apply, isTalking }
}
