// Seed history: scripted playthroughs graded by the real grader, with fixed dates so output is stable.

import { ALL_CASES } from '@/features/cases/data'
import type { Case } from '@/features/cases/types'
import { grade } from '@/features/grading/grade'
import { buildScriptedLog } from '@/features/grading/scripted-logs'
import type { ScriptKind } from '@/features/grading/scripted-logs'
import type { SessionRecord } from './repository'

function byId(id: string): Case {
  const c = ALL_CASES.find((x) => x.id === id)
  if (!c) throw new Error(`Unknown case ${id}`)
  return c
}

function record(
  id: string,
  mode: 'er' | 'poli',
  savedAt: string,
  plays: [string, ScriptKind][],
): SessionRecord {
  const logs = plays.map(([caseId, kind]) => {
    const c = byId(caseId)
    const log = buildScriptedLog(c, kind)
    return { c, log }
  })
  return {
    id,
    mode,
    savedAt,
    durationSec: Math.max(...logs.map((l) => l.log.endedAtSec ?? 0)),
    evaluations: logs.map(({ c, log }) => grade(log, c)),
    demo: true,
  }
}

export function createDemoRecords(): SessionRecord[] {
  return [
    record('demo-poli-htn', 'poli', '2026-10-02T09:15:00.000Z', [['poli-hipertensi', 'perfect']]),
    record('demo-poli-tb', 'poli', '2026-10-04T13:40:00.000Z', [['poli-tb-paru', 'average']]),
    record('demo-poli-dm2', 'poli', '2026-10-06T08:05:00.000Z', [['poli-dm2', 'bad']]),
    record('demo-er-shift', 'er', '2026-10-08T19:30:00.000Z', [
      ['er-acs-stemi', 'perfect'],
      ['er-dengue-dss', 'average'],
      ['er-malaria-berat', 'bad'],
    ]),
  ]
}
