// Per-case facts shown on a case card. Pure, shared by every surface that lists cases.

import { Bug, Brain, Droplets, HeartPulse, Siren, Stethoscope, Wind, type LucideIcon } from 'lucide-react'
import type { BadgeCategory } from '@/components/ui/badge'
import { getGuideline } from '@/features/grading/guidelines'
import type { Case, Mode } from './types'

export const CATEGORY_ICONS: Record<BadgeCategory, LucideIcon> = {
  infection: Bug,
  cardio: HeartPulse,
  endocrine: Droplets,
  pulmo: Wind,
  neuro: Brain,
}

export const MODE_ICONS: Record<Mode, LucideIcon> = {
  er: Siren,
  poli: Stethoscope,
}

const TOPIC_CATEGORY: Record<string, BadgeCategory> = {
  dengue: 'infection',
  malaria: 'infection',
  tb: 'pulmo',
  acs: 'cardio',
  hypertension: 'cardio',
  diabetes: 'endocrine',
  stroke: 'neuro',
  sepsis: 'infection',
  pneumonia: 'pulmo',
  copd: 'pulmo',
  anaphylaxis: 'pulmo',
  ugib: 'infection',
  typhoid: 'infection',
  asthma: 'pulmo',
  uti: 'infection',
  'pregnancy-htn': 'cardio',
  leprosy: 'infection',
}

/** Specialty hue, derived from the case's first registry guideline topic. */
export function caseCategory(c: Pick<Case, 'guidelineIds'>): BadgeCategory {
  const topic = c.guidelineIds.map((id) => getGuideline(id)?.topic).find(Boolean)
  return (topic && TOPIC_CATEGORY[topic]) || 'infection'
}

/** Rough session length: ER is a faster, busier encounter; harder cases take longer. */
export function estimateMinutes(c: Pick<Case, 'mode' | 'difficulty'>): number {
  const base = c.mode === 'er' ? 15 : 10
  return base + (c.difficulty === 'sulit' ? 5 : c.difficulty === 'sedang' ? 2 : 0)
}
