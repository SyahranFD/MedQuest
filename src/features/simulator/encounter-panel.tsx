import type { ReactNode } from 'react'
import { ClipboardCheck, FlaskConical, MessagesSquare, Pill, Stethoscope, type LucideIcon } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import type { Case } from '@/features/cases/types'
import type { Session, SessionPatient } from '@/features/session/types'
import { AnamnesisPanel } from './anamnesis-panel'
import { DiagnosisPanel } from './diagnosis-panel'
import { ExamPanel } from './exam-panel'
import { OrdersPanel } from './orders-panel'
import { TreatmentPanel } from './treatment-panel'
import { useST } from './use-st'

export type PanelTab = 'anamnesis' | 'exam' | 'orders' | 'dx' | 'rx'

export const PANEL_TABS: { id: PanelTab; icon: LucideIcon }[] = [
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

interface PanelBodyProps {
  caseDef: Case
  session: Session
  patient: SessionPatient
  actions: PanelActions
  focusToken: number
  /** ER only: triage controls, shown in the Diagnosis tab and under the note for a patient who is no longer in a bed. */
  triage?: ReactNode
}

/** Tab contents for the selected patient; explains why they are unavailable once the patient has left the bed. */
export function PanelBody({ caseDef, session, patient, actions, focusToken, triage }: PanelBodyProps) {
  const st = useST()
  if (patient.status !== 'in-bed') {
    return PANEL_TABS.map(({ id }) => (
      <TabsContent key={id} value={id} className="flex flex-col gap-4 p-5">
        <p role="status" className="rounded-md border border-dashed border-line-strong p-4 text-body-s text-ink-2" data-testid="panel-unavailable">
          {st('panel.resolved', { name: caseDef.patient.name })}
        </p>
        {triage}
      </TabsContent>
    ))
  }
  return (
    <>
      <TabsContent value="anamnesis" className="md:h-full">
        <AnamnesisPanel caseDef={caseDef} patient={patient} focusToken={focusToken} onAsk={actions.ask} onSend={actions.send} />
      </TabsContent>
      <TabsContent value="exam" className="p-5">
        <ExamPanel caseDef={caseDef} patient={patient} onExamine={actions.examine} />
      </TabsContent>
      <TabsContent value="orders" className="p-5">
        <OrdersPanel
          caseDef={caseDef}
          session={session}
          patient={patient}
          onOrder={actions.order}
          onOrderPanel={actions.orderPanel}
          onMarkSeen={actions.markSeen}
        />
      </TabsContent>
      <TabsContent value="dx" className="flex flex-col gap-5 p-5">
        {triage}
        <DiagnosisPanel caseDef={caseDef} patient={patient} onCommit={actions.diagnose} />
      </TabsContent>
      <TabsContent value="rx" className="p-5">
        <TreatmentPanel caseDef={caseDef} mode={session.mode} patient={patient} onTreat={actions.treat} onDispose={actions.dispose} />
      </TabsContent>
    </>
  )
}
