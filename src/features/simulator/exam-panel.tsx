import { Check, Hand, Heart, Brain, ScanFace, Shield, Stethoscope, UserRound, AudioLines, CircleDot, Fingerprint, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { EXAM_SYSTEM_LABELS } from '@/features/cases/types'
import type { Case, ExamSystem } from '@/features/cases/types'
import type { SessionPatient } from '@/features/session/types'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { TabHeader } from './tab-header'
import { useST } from './use-st'
import { VitalsGrid } from './vitals-grid'

interface ExamPanelProps {
  caseDef: Case
  patient: SessionPatient
  onExamine: (examId: string) => void
}

const SYSTEM_ICON: Record<ExamSystem, LucideIcon> = {
  umum: UserRound,
  'kepala-leher': ScanFace,
  thorax: Shield,
  jantung: Heart,
  paru: AudioLines,
  abdomen: CircleDot,
  ekstremitas: Hand,
  kulit: Fingerprint,
  neurologi: Brain,
}

/** "Body checklist": vitals on top, a tile per body system, and a detail pane for the tapped system. */
export function ExamPanel({ caseDef, patient, onExamine }: ExamPanelProps) {
  const st = useST()
  const [locale] = useLocale()
  const done = new Set(patient.log.exams.map((e) => e.id))
  const systems = [...new Set(caseDef.exam.map((e) => e.system))] as ExamSystem[]
  const [active, setActive] = useState<ExamSystem | undefined>(systems[0])
  const sysLabel = (s: ExamSystem) => (locale === 'en' ? (EXAM_SYSTEM_LABELS[s].en ?? EXAM_SYSTEM_LABELS[s].id) : EXAM_SYSTEM_LABELS[s].id)
  const items = caseDef.exam.filter((e) => e.system === active)

  return (
    <div className="flex flex-col gap-5" data-testid="exam-panel">
      <TabHeader icon={Stethoscope} tint="teal" title={st('tab.exam')} hint={st('exam.hint')} />

      <section className="flex flex-col gap-2" aria-label={st('exam.vitals')}>
        <h3 className="text-label font-semibold text-ink-muted uppercase">{st('exam.vitals')}</h3>
        <VitalsGrid vitals={patient.vitals} />
      </section>

      <section className="flex flex-col gap-2" aria-label={st('exam.systems')}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-label font-semibold text-ink-muted uppercase">{st('exam.systems')}</h3>
          <p className="text-label text-ink-muted">{st('exam.consentHint')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div role="group" aria-label={st('exam.systems')} className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3 md:grid-cols-2">
            {systems.map((s) => {
              const Icon = SYSTEM_ICON[s]
              const all = caseDef.exam.filter((e) => e.system === s)
              const n = all.filter((e) => done.has(e.id)).length
              const complete = n === all.length
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active === s}
                  onClick={() => setActive(s)}
                  data-testid="exam-tile"
                  className={cn(
                    'flex min-h-20 flex-col items-start justify-between gap-2 rounded-md border p-3 text-left transition-[background-color,border-color,transform] duration-100 select-none active:scale-[.985]',
                    active === s ? 'border-primary bg-primary-quiet' : 'border-line bg-surface hover:bg-panel',
                  )}
                >
                  <span className="flex w-full items-center justify-between">
                    <Icon className="size-5 text-ink-2" strokeWidth={1.75} aria-hidden="true" />
                    {complete && <Check className="size-4 text-success" strokeWidth={2.25} aria-hidden="true" />}
                  </span>
                  <span className="flex w-full items-end justify-between gap-2 text-meta font-medium text-ink-1">
                    <span>{sysLabel(s)}</span>
                    <span className="text-label font-normal text-ink-muted tabular-nums">
                      {n}/{all.length}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex min-h-40 flex-col rounded-md border border-line bg-surface" data-testid="exam-detail" aria-live="polite">
            {active && (
              <>
                <h4 className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-meta font-semibold text-ink-1">
                  {(() => {
                    const Icon = SYSTEM_ICON[active]
                    return <Icon className="size-4 text-ink-3" strokeWidth={1.75} aria-hidden="true" />
                  })()}
                  {sysLabel(active)}
                </h4>
                <ul className="flex flex-col divide-y divide-line">
                  {items.map((e) => {
                    const seen = done.has(e.id)
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => onExamine(e.id)}
                          aria-expanded={seen}
                          className={cn(
                            'flex min-h-11 w-full flex-col gap-1 px-3 py-2.5 text-left text-meta transition-[background-color] duration-100 select-none',
                            seen ? 'bg-surface' : 'hover:bg-panel active:bg-inset',
                          )}
                        >
                          <span className="flex items-center justify-between gap-2 font-medium text-ink-1">
                            {e.label}
                            {seen ? (
                              <Badge variant={e.abnormal ? 'danger' : 'success'}>{st(e.abnormal ? 'exam.abnormalShort' : 'orders.normal')}</Badge>
                            ) : (
                              <span className="text-label font-medium text-primary">{st('exam.examine')}</span>
                            )}
                          </span>
                          {seen && <span className="text-ink-2">{e.finding}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
