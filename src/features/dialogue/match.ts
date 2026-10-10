import type { Case, DialogueEntry, EmotionAction, Intent, Tone } from '@/features/cases/types'
import { classifyTone, isClosedQuestion } from './tone'
import { contentTokens, hashString, tokenMatches } from './normalize'

export interface MatchOptions {
  /** Student acted before the patient finished speaking. */
  interrupted?: boolean
  /** Dialogue ids already asked in this encounter (click or chat). */
  askedIds?: readonly string[]
  /** Extra rotation for fallback replies. */
  variantIndex?: number
}

export type MatchKind = 'answer' | 'withheld' | 'social' | 'unclear'

export interface MatchResult {
  kind: MatchKind
  entry?: DialogueEntry
  reply: string
  withheld: boolean
  repeated: boolean
  score: number
  tone: Tone
  intents: Intent[]
  closed: boolean
  /** What this reply means for the patient's emotion state (the emotion engine applies it). */
  action: EmotionAction
}

/** Minimum score to accept a keyword match (single-word pattern = 2). */
export const MATCH_THRESHOLD = 2

const HURT_REPLY = 'Dok, saya kurang nyaman dengan cara bertanya seperti itu.'
const DEFAULT_WITHHELD = 'Hmm... saya rasa itu tidak terlalu penting, Dok.'

interface PreparedEntry {
  entry: DialogueEntry
  groups: string[][]
}

const cache = new WeakMap<Case, PreparedEntry[]>()

function prepare(c: Case) {
  let prepared = cache.get(c)
  if (!prepared) {
    prepared = c.dialogue.map((entry) => ({
      entry,
      groups: entry.patterns.map((p) => contentTokens(p)).filter((g) => g.length > 0),
    }))
    cache.set(c, prepared)
  }
  return prepared
}

function scoreGroups(tokens: string[], groups: string[][]) {
  let best = 0
  let extra = 0
  for (const g of groups) {
    const matched = g.filter((t) => tokens.some((x) => tokenMatches(x, t))).length
    let score = 0
    if (matched === g.length) score = g.length + 1
    else if (g.length >= 3 && matched === g.length - 1) score = g.length - 1 + 0.2
    if (score > best) {
      if (best >= MATCH_THRESHOLD) extra += 1
      best = score
    } else if (score >= MATCH_THRESHOLD) extra += 1
  }
  // several distinct patterns agreeing is a small tie-breaker
  return best >= MATCH_THRESHOLD ? best + Math.min(extra, 3) * 0.3 : best
}

/** Categories whose cue word in the question should pull toward that category. */
const CATEGORY_CUES: Partial<Record<DialogueEntry['category'], string[]>> = {
  keluarga: contentTokens('keluarga'),
  alergi: contentTokens('alergi'),
}

function categoryBonus(tokens: string[], entry: DialogueEntry) {
  const cues = CATEGORY_CUES[entry.category]
  return cues && cues.some((cue) => tokens.includes(cue)) ? 1.5 : 0
}

/** Best dialogue entry for free text, or undefined when nothing clears the threshold. */
export function findEntry(c: Case, text: string): { entry: DialogueEntry; score: number } | undefined {
  const tokens = contentTokens(text)
  if (tokens.length === 0) return undefined
  let best: { entry: DialogueEntry; score: number } | undefined
  for (const { entry, groups } of prepare(c)) {
    const base = scoreGroups(tokens, groups)
    if (base < MATCH_THRESHOLD) continue
    // tie-break: prefer the entry that explains more of what the student said
    const score = base + categoryBonus(tokens, entry) + 0.01 * Math.min(tokens.length, 10)
    if (!best || score > best.score) best = { entry, score }
  }
  return best
}

function buildAction(
  kind: 'ask' | 'chat',
  tone: Tone,
  intents: Intent[],
  outcome: NonNullable<EmotionAction['outcome']>,
  closed: boolean,
): EmotionAction {
  return { kind, tone, intents, outcome, closed }
}

/** Reply for a known entry (clickable question or matched text). Does not mutate anything. */
export function answerEntry(
  c: Case,
  entry: DialogueEntry,
  state: { trust: number },
  opts: MatchOptions & { text?: string; kind?: 'ask' | 'chat'; score?: number } = {},
): MatchResult {
  const text = opts.text ?? entry.question
  const repeated = opts.askedIds?.includes(entry.id) ?? false
  const { tone, intents } = classifyTone(text, { interrupted: opts.interrupted, repeated })
  const closed = isClosedQuestion(text)
  const withheld = entry.minTrust !== undefined && state.trust < entry.minTrust
  let reply = withheld ? (entry.gatedAnswer ?? DEFAULT_WITHHELD) : entry.answer
  if (repeated && !withheld) reply = `${c.fallbacks.repeatPrefix} ${reply}`
  else if (opts.interrupted) reply = `${c.fallbacks.interruptedReply} ${reply}`
  return {
    kind: withheld ? 'withheld' : 'answer',
    entry,
    reply,
    withheld,
    repeated,
    score: opts.score ?? MATCH_THRESHOLD,
    tone,
    intents,
    closed,
    action: buildAction(opts.kind ?? 'ask', tone, intents, withheld ? 'withheld' : 'answered', closed),
  }
}

/**
 * Match typed Indonesian text against a case: scored keyword matching with a social-intent layer
 * (greeting, empathy, reassurance) and a clarification fallback that costs a little patience.
 */
export function matchReply(
  c: Case,
  text: string,
  state: { trust: number },
  opts: MatchOptions = {},
): MatchResult {
  const found = findEntry(c, text)
  if (found) {
    return answerEntry(c, found.entry, state, { ...opts, text, kind: 'chat', score: found.score })
  }

  const { tone, intents } = classifyTone(text, { interrupted: opts.interrupted })
  const closed = isClosedQuestion(text)
  const social = (reply: string): MatchResult => ({
    kind: 'social',
    reply,
    withheld: false,
    repeated: false,
    score: 0,
    tone,
    intents,
    closed,
    action: buildAction('chat', tone, intents, 'social', closed),
  })

  if (tone === 'menghakimi') return social(HURT_REPLY)
  if (intents.includes('empathy')) return social(c.fallbacks.empathyReply)
  if (intents.includes('reassure')) return social(c.fallbacks.reassureReply)
  if (intents.some((i) => i === 'greet' || i === 'intro' || i === 'consent' || i === 'agenda')) {
    return social(c.greeting)
  }
  if (intents.includes('safety-net') || intents.includes('summary') || intents.includes('plain-language')) {
    return social('Baik, Dok, saya mengerti.')
  }

  const list = c.fallbacks.unclear
  const idx = (hashString(text) + (opts.variantIndex ?? 0)) % list.length
  return {
    kind: 'unclear',
    reply: list[idx],
    withheld: false,
    repeated: false,
    score: 0,
    tone,
    intents,
    closed,
    action: buildAction('chat', tone, intents, 'unclear', closed),
  }
}
