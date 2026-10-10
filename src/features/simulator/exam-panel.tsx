import { Badge } from '@/components/ui/badge'
import { EXAM_SYSTEM_LABELS } from '@/features/cases/types'
import type { Case, ExamSystem, Vitals } from '@/features/cases/types'
import type { SessionPatient } from '@/features/session/types'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { abnormalVitals } from './case-meta'
import { useST } from './use-st'

interface ExamPanelProps {
  caseDef: Case
  patient: SessionPatient
  onExamine: (examId: string) => void
}

function VitalTile({ label, value, unit, abnormal }: { label: string; value: string; unit: string; abnormal: boolean }) {
  const st = useST()
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 rounded-sm border bg-surface p-2.5', abnormal ? 'border-ink-2' : 'border-line')}>
      <span className="truncate text-label font-semibold text-ink-muted">{label}</span>
      <span className="text-body font-semibold text-ink-1 tabular-nums">
        {value}
        <span className="ml-1 text-label font-medium text-ink-muted">{unit}</span>
      </span>
      {abnormal && <Badge variant="warning">{st('exam.abnormalShort')}</Badge>}
    </div>
  )
}

export function VitalsGrid({ vitals }: { vitals: Vitals }) {
  const st = useST()
  const a = abnormalVitals(vitals)
  return (
    <div className="grid grid-cols-3 gap-2" data-testid="vitals-grid">
      <VitalTile label={st('vitals.hr')} value={String(Math.round(vitals.hr))} unit="/mnt" abnormal={a.hr} />
      <VitalTile label={st('vitals.bp')} value={`${Math.round(vitals.sbp)}/${Math.round(vitals.dbp)}`} unit="mmHg" abnormal={a.sbp || a.dbp} />
      <VitalTile label={st('vitals.rr')} value={String(Math.round(vitals.rr))} unit="/mnt" abnormal={a.rr} />
      <VitalTile label={st('vitals.spo2')} value={String(Math.round(vitals.spo2))} unit="%" abnormal={a.spo2} />
      <VitalTile label={st('vitals.temp')} value={vitals.temp.toFixed(1)} unit="C" abnormal={a.temp} />
      <VitalTile label={st('vitals.gcs')} value={String(Math.round(vitals.gcs))} unit="" abnormal={a.gcs} />
    </div>
  )
}

export function ExamPanel({ caseDef, patient, onExamine }: ExamPanelProps) {
  const st = useST()
  const [locale] = useLocale()
  const done = new Set(patient.log.exams.map((e) => e.id))
  const systems = [...new Set(caseDef.exam.map((e) => e.system))] as ExamSystem[]

  return (
    <div className="flex flex-col gap-4" data-testid="exam-panel">
      <section className="flex flex-col gap-2">
        <h3 className="text-body-s font-semibold text-ink-1">{st('exam.vitals')}</h3>
        <VitalsGrid vitals={patient.vitals} />
      </section>
      <p className="text-label text-ink-muted">{st('exam.consentHint')}</p>
      {systems.map((sys) => {
        const label = EXAM_SYSTEM_LABELS[sys]
        return (
          <section key={sys} aria-label={locale === 'en' ? (label.en ?? label.id) : label.id} className="flex flex-col gap-1.5">
            <h4 className="text-label font-semibold text-ink-muted uppercase">{locale === 'en' ? (label.en ?? label.id) : label.id}</h4>
            <ul className="flex flex-col gap-1.5">
              {caseDef.exam
                .filter((e) => e.system === sys)
                .map((e) => {
                  const seen = done.has(e.id)
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onExamine(e.id)}
                        aria-expanded={seen}
                        className={cn(
                          'flex min-h-11 w-full flex-col gap-1 rounded-sm border px-3 py-2 text-left text-body-s transition-[background-color,transform] duration-100 select-none active:scale-[.985]',
                          seen ? 'border-line bg-panel' : 'border-line-strong bg-surface hover:bg-panel',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2 font-medium text-ink-1">
                          {e.label}
                          {seen && e.abnormal && <Badge variant="warning">{st('exam.abnormalShort')}</Badge>}
                        </span>
                        {seen && <span className="text-ink-2">{e.finding}</span>}
                      </button>
                    </li>
                  )
                })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
