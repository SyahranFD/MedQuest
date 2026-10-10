import type { Band, Difficulty, Dimension, Evaluation, Mode } from '@/features/cases/types'

export interface ClassMeta {
  faculty: string
  program: string
  cohort: string
  className: string
  studentCount: number
  weekCount: number
  /** ISO timestamp the whole mock class is measured against. */
  asOf: string
}

export interface ClassAttempt {
  id: string
  studentId: string
  caseId: string
  /** ISO timestamp. */
  at: string
  /** 1-based week index, 1 is the oldest. */
  week: number
  durationSec: number
  evaluation: Evaluation
}

export interface ClassStudent {
  id: string
  name: string
  initials: string
  nim: string
  /** Attempts, oldest first. */
  attempts: ClassAttempt[]
}

export type StudentStatus = 'on-track' | 'attention' | 'inactive'
export type AttentionReason = 'low-score' | 'declining' | 'inactive' | 'low-progress'

export interface StudentSummary {
  id: string
  name: string
  initials: string
  nim: string
  attemptCount: number
  casesCompleted: number
  casesTotal: number
  /** 0 to 100. */
  progress: number
  /** 0 to 100, or null when there are no attempts. */
  averagePercent: number | null
  recentPercent: number | null
  averageEmpathy: number | null
  lastActiveAt: string | null
  daysSinceActive: number | null
  dimensionAverages: Record<Dimension, number> | null
  weakestDimension: Dimension | null
  status: StudentStatus
  reasons: AttentionReason[]
}

export interface StudentDetail extends StudentSummary {
  attempts: ClassAttempt[]
}

export interface ClassKpis {
  activeThisWeek: number
  activePreviousWeek: number
  enrolled: number
  averagePercent: number
  averagePreviousWeek: number
  completionRate: number
  completedPairs: number
  possiblePairs: number
  averageEmpathy: number
}

export interface ClassOverview {
  meta: ClassMeta
  kpis: ClassKpis
  dimensionAverages: Record<Dimension, number>
  attention: StudentSummary[]
}

export interface CaseStats {
  caseId: string
  title: string
  mode: Mode
  difficulty: Difficulty
  attempts: number
  studentsAttempted: number
  averagePercent: number
  /** Share of attempts at band pass or above, 0 to 100. */
  passRate: number
  averageEmpathy: number
  bands: Record<Band, number>
  /** 1 is the hardest (lowest average). */
  hardestRank: number
}

export interface MissedCriterion {
  criterionId: string
  caseId: string
  caseTitle: string
  dimension: Dimension
  label: string
  /** Share of attempts where the criterion was not fully met, 0 to 100. */
  missRate: number
  attempts: number
  cite?: { id: string; title: string; issuer: string; year?: number }
}

export interface WeeklyPoint {
  week: number
  /** ISO date of the Monday starting the week. */
  startsAt: string
  attempts: number
  activeStudents: number
  averagePercent: number | null
  averageEmpathy: number | null
}
