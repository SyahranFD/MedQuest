import { ClipboardCheck, FlaskConical, MessagesSquare, Pill, Stethoscope, type LucideIcon } from 'lucide-react'
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Case } from '@/features/cases/types'
import type { Session, SessionPatient } from '@/features/session/types'
import { cn } from '@/lib/utils'
import { AnamnesisPanel } from './anamnesis-panel'
import { DiagnosisPanel } from './diagnosis-panel'
import { ExamPanel } from './exam-panel'
import { OrdersPanel } from './orders-panel'
import { TreatmentPanel } from './treatment-panel'
import { useST } from './use-st'

export type PanelTab = 'anamnesis' | 'exam' | 'orders' | 'dx' | 'rx'

const TABS: { id: PanelTab; icon: LucideIcon }[] = [
  { id: 'anamnesis', icon: MessagesSquare },
  { id: 'exam', icon: Stethoscope },
  { id: 'orders', icon: FlaskConical },
  { id: 'dx', icon: ClipboardCheck },
  { id: 'rx', icon: Pill },
]

export interface PanelActions {
  ask: (entryId: string) => void
  send: (text: string) => void
  examine: (examId: string) => void
  order: (testId: string) => void
  orderPanel: (testIds: string[]) => void
  markSeen: () => void
  diagnose: (diagnosisId: string) => void
  treat: (treatmentId: string, opts: { dose?: string; duration?: string }) => void
  dispose: (dispositionId: string) => void
}

export function PanelTabList({ unseenResults, onPress, className }: { unseenResults: number; onPress?: () => void; className?: string }) {
  const st = useST()
  return (
    <TabsList aria-label={st('tab.label')} className={cn('grid w-full grid-cols-5 gap-0 p-0.5 lg:p-1', className)}>
      {TABS.map(({ id, icon: Icon }) => (
        <TabsTrigger key={id} value={id} onClick={onPress} className="relative h-12 min-w-0 flex-col gap-0.5 px-0 text-label tracking-normal lg:h-11">
          <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          <span className="max-w-full truncate">{st(`tab.${id}`)}</span>
          {id === 'orders' && unseenResults > 0 && (
            <span className="absolute top-1 right-1.5 grid size-4 place-items-center rounded-full bg-ink-1 text-[10px] font-semibold text-primary-ink">
              {unseenResults}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}

interface PanelBodyProps {
  caseDef: Case
  session: Session
  patient: SessionPatient
  actions: PanelActions
  focusToken: number
}

/** Tab contents for the selected patient; explains why they are unavailable when the patient is not in a bed. */
export function PanelBody({ caseDef, session, patient, actions, focusToken }: PanelBodyProps) {
  const st = useST()
  if (patient.status !== 'in-bed') {
    return TABS.map(({ id }) => (
      <TabsContent key={id} value={id}>
        <p role="status" className="rounded-md border border-dashed border-line-strong p-4 text-body-s text-ink-2" data-testid="panel-unavailable">
          {st(patient.status === 'waiting' ? 'panel.waiting' : 'panel.resolved', { name: caseDef.patient.name })}
        </p>
      </TabsContent>
    ))
  }
  return (
    <>
      <TabsContent value="anamnesis">
        <AnamnesisPanel caseDef={caseDef} patient={patient} focusToken={focusToken} onAsk={actions.ask} onSend={actions.send} />
      </TabsContent>
      <TabsContent value="exam">
        <ExamPanel caseDef={caseDef} patient={patient} onExamine={actions.examine} />
      </TabsContent>
      <TabsContent value="orders">
        <OrdersPanel
          caseDef={caseDef}
          session={session}
          patient={patient}
          onOrder={actions.order}
          onOrderPanel={actions.orderPanel}
          onMarkSeen={actions.markSeen}
        />
      </TabsContent>
      <TabsContent value="dx">
        <DiagnosisPanel caseDef={caseDef} patient={patient} onCommit={actions.diagnose} />
      </TabsContent>
      <TabsContent value="rx">
        <TreatmentPanel caseDef={caseDef} mode={session.mode} patient={patient} onTreat={actions.treat} onDispose={actions.dispose} />
      </TabsContent>
    </>
  )
}
