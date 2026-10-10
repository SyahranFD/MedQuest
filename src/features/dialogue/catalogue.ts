import { CATEGORY_LABELS, DIALOGUE_CATEGORIES } from '@/features/cases/types'
import type { Case, DialogueCategory, Label } from '@/features/cases/types'
import { isClosedQuestion } from './tone'

export interface CatalogueQuestion {
  id: string
  question: string
  relevant: boolean
  closed: boolean
  /** True when the answer is trust-gated (UI may show a lock hint). */
  gated: boolean
}

export interface CatalogueCategory {
  category: DialogueCategory
  label: Label
  questions: CatalogueQuestion[]
}

/** Clickable question list per category, derived from the case's dialogue. Empty categories are kept out. */
export function buildQuestionCatalogue(c: Case): CatalogueCategory[] {
  return DIALOGUE_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    questions: c.dialogue
      .filter((d) => d.category === category)
      .map((d) => ({
        id: d.id,
        question: d.question,
        relevant: d.relevant,
        closed: isClosedQuestion(d.question),
        gated: d.minTrust !== undefined,
      })),
  })).filter((g) => g.questions.length > 0)
}
