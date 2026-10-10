// Mock "assign a case" persistence. localStorage only; every access is guarded.

export interface Assignment {
  id: string
  /** Student id, or "class" for the whole class. */
  target: string
  caseId: string
  /** ISO timestamp. */
  at: string
}

export const ASSIGNMENTS_KEY = 'mq-dosen-assignments'

const isAssignment = (v: unknown): v is Assignment =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Assignment).id === 'string' &&
  typeof (v as Assignment).target === 'string' &&
  typeof (v as Assignment).caseId === 'string' &&
  typeof (v as Assignment).at === 'string'

export function listAssignments(): Assignment[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isAssignment) : []
  } catch {
    return []
  }
}

function write(list: Assignment[]) {
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

/** Adds an assignment (one per target and case). Returns it, or null when storage failed. */
export function addAssignment(target: string, caseId: string, at = new Date().toISOString()): Assignment | null {
  const rest = listAssignments().filter((a) => !(a.target === target && a.caseId === caseId))
  const created: Assignment = { id: `${target}:${caseId}`, target, caseId, at }
  return write([created, ...rest]) ? created : null
}

export function removeAssignment(id: string): void {
  write(listAssignments().filter((a) => a.id !== id))
}
