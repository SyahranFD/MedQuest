import type { BadgeCategory } from '@/components/ui/badge'
import type { Case, Severity, Vitals } from '@/features/cases/types'
import { requireCase } from '@/features/cases/repository'
import { hashString } from '@/features/dialogue'
import { RESOLVED_STATUSES } from '@/features/session/types'
import type { Session, SessionPatient } from '@/features/session/types'

const CATEGORY_BY_CASE: Record<string, BadgeCategory> = {
  'er-acs-stemi': 'cardio',
  'er-dengue-dss': 'infection',
  'er-malaria-berat': 'infection',
  'poli-tb-paru': 'pulmo',
  'poli-hipertensi': 'cardio',
  'poli-dm2': 'endocrine',
}

/** Specialty badge hue: fixed for the six demo cases, keyword fallback for anything added later. */
export function categoryOf(c: Pick<Case, 'id' | 'specialty'>): BadgeCategory {
  const known = CATEGORY_BY_CASE[c.id]
  if (known) return known
  const s = c.specialty.toLowerCase()
  if (s.includes('kardio') || s.includes('jantung')) return 'cardio'
  if (s.includes('infeksi') || s.includes('tropik')) return 'infection'
  if (s.includes('endokrin')) return 'endocrine'
  if (s.includes('paru')) return 'pulmo'
  return 'neuro'
}

const LABEL_BY_CASE: Record<string, string> = {
  'er-acs-stemi': 'Kardiologi',
  'er-dengue-dss': 'Infeksi tropis',
  'er-malaria-berat': 'Tropik infeksi',
  'poli-tb-paru': 'Paru',
  'poli-hipertensi': 'Kardiovaskular',
  'poli-dm2': 'Endokrin',
}

/** Short specialty for the badge. Fixed for the demo cases; otherwise the focus segment of "Penyakit Dalam / X / IGD". */
export function specialtyLabel(c: Pick<Case, 'id' | 'specialty'>): string {
  const known = LABEL_BY_CASE[c.id]
  if (known) return known
  const parts = c.specialty.split('/').map((p) => p.trim())
  return parts.length > 1 ? (parts.find((p) => p !== 'IGD' && p !== 'Penyakit Dalam') ?? parts[0]!) : c.specialty
}

export const SEVERITY_BADGE: Record<Severity, 'success' | 'warning' | 'danger'> = {
  stable: 'success',
  urgent: 'warning',
  critical: 'danger',
}

export type StatusKey = 'stabil' | 'mendesak' | 'kritis' | 'memburuk' | 'meninggal' | 'selesai'

export const STATUS_VARIANT: Record<StatusKey, 'success' | 'warning' | 'danger' | 'neutral'> = {
  stabil: 'success',
  mendesak: 'warning',
  kritis: 'danger',
  memburuk: 'warning',
  meninggal: 'danger',
  selesai: 'neutral',
}

/** Bed status chip: severity at arrival, then the deterioration stage once it starts. */
export function patientStatus(p: Pick<SessionPatient, 'status' | 'stage'>, severity: Severity): StatusKey {
  if (p.status === 'deceased') return 'meninggal'
  if (RESOLVED_STATUSES.includes(p.status)) return 'selesai'
  if (p.stage >= 2) return 'kritis'
  if (p.stage === 1) return 'memburuk'
  return severity === 'critical' ? 'kritis' : severity === 'urgent' ? 'mendesak' : 'stabil'
}

/** Values outside a normal adult range, for the "abnormal" mark on the vitals tiles. */
export function abnormalVitals(v: Vitals): Record<keyof Vitals, boolean> {
  return {
    hr: v.hr > 100 || v.hr < 55,
    sbp: v.sbp >= 140 || v.sbp < 95,
    dbp: v.dbp >= 90 || v.dbp < 55,
    rr: v.rr > 20 || v.rr < 12,
    spo2: v.spo2 < 95,
    temp: v.temp >= 37.8 || v.temp < 35.5,
    gcs: v.gcs < 15,
  }
}

/** Deterministic shuffle so the correct diagnosis is not always first, stable per case. */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const out = items.slice()
  let a = hashString(seed) >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export interface UnfinishedItem {
  key: 'upcoming' | 'notBedded' | 'noDiagnosis' | 'noDisposition' | 'unseenResults'
  name: string
  count?: number
}

/** What the student would leave undone if the session ended now. */
export function unfinishedItems(session: Session, lookup: (id: string) => Case = requireCase): UnfinishedItem[] {
  const items: UnfinishedItem[] = []
  const upcoming = session.order.filter((id) => session.patients[id]!.status === 'upcoming')
  if (upcoming.length) items.push({ key: 'upcoming', name: '', count: upcoming.length })
  for (const id of session.order) {
    const p = session.patients[id]!
    if (p.status === 'upcoming' || RESOLVED_STATUSES.includes(p.status)) continue
    const name = lookup(p.caseId).patient.name
    if (p.status === 'waiting') {
      items.push({ key: 'notBedded', name })
      continue
    }
    if (!p.log.diagnosisId) items.push({ key: 'noDiagnosis', name })
    if (!p.log.dispositionId) items.push({ key: 'noDisposition', name })
    const unseen = p.log.orders.filter((o) => o.readyAtSec <= session.nowSec && o.seenAtSec === undefined).length
    if (unseen) items.push({ key: 'unseenResults', name, count: unseen })
  }
  return items
}
