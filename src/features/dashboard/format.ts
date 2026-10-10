import type { Band } from '@/features/cases/types'
import type { BadgeCategory } from '@/components/ui/badge'
import { getGuideline } from '@/features/grading/guidelines'
import type { Case } from '@/features/cases/types'
import type { Locale } from '@/lib/i18n'
import type { StudentStatus } from './types'

export const dateLocale = (locale: Locale) => (locale === 'id' ? 'id-ID' : 'en-GB')

export function formatShortDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(dateLocale(locale), { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
}

export type BadgeVariant = 'danger' | 'warning' | 'success' | 'neutral'

/** Rating badge colour: success for good and above, neutral for pass, warning and danger below. */
export const BAND_VARIANT: Record<Band, BadgeVariant> = {
  excellent: 'success',
  good: 'success',
  pass: 'neutral',
  borderline: 'warning',
  'clear-fail': 'danger',
}

export const STATUS_VARIANT: Record<StudentStatus, BadgeVariant> = {
  'on-track': 'success',
  attention: 'warning',
  inactive: 'danger',
}

const TOPIC_CATEGORY: Record<string, BadgeCategory> = {
  dengue: 'infection',
  malaria: 'infection',
  tb: 'pulmo',
  acs: 'cardio',
  hypertension: 'cardio',
  diabetes: 'endocrine',
}

/** Specialty badge hue, derived from the case's first registry guideline topic. */
export function caseCategory(c: Pick<Case, 'guidelineIds'>): BadgeCategory {
  const topic = c.guidelineIds.map((id) => getGuideline(id)?.topic).find(Boolean)
  return (topic && TOPIC_CATEGORY[topic]) || 'infection'
}

const ISSUER_ABBR: Record<string, string> = {
  'Kementerian Kesehatan RI': 'Kemenkes',
  'World Health Organization': 'WHO',
  'European Society of Cardiology': 'ESC',
  'European Society of Cardiology and European Society of Hypertension': 'ESC/ESH',
  'American Diabetes Association': 'ADA',
}

/** "Perhimpunan ... (PERKI)" becomes "PERKI"; known issuers use their usual abbreviation. */
export function shortIssuer(issuer: string): string {
  const paren = /\(([^)]+)\)\s*$/.exec(issuer)
  return paren?.[1] ?? ISSUER_ABBR[issuer] ?? issuer
}
