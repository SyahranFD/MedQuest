import { toast, type ExternalToast } from 'sonner'
import type { SessionEvent } from '@/features/session/types'
import type { ST } from './use-st'

/** Id of the encounter's own Toaster, placed so toasts never cover the clock or the controls. */
export const SIM_TOASTER = 'sim'

type Kind = 'success' | 'warning' | 'error' | 'info'

/** Toast through the encounter toaster. */
export function notify(kind: Kind, message: string, opts: Omit<ExternalToast, 'toasterId'> = {}) {
  toast[kind](message, { ...opts, toasterId: SIM_TOASTER })
}

interface ToastContext {
  st: ST
  /** Patient display name for the description line (ER only). */
  nameOf: (patientId: string) => string
  /** Select the patient and open the Lab tab. */
  openResults: (patientId: string) => void
  selectPatient: (patientId: string) => void
  /** Only ER shows a patient name; poli has one patient. */
  showName: boolean
}

/** Toast for an engine event. Pure of React: easy to test with a stub `toast`. */
export function toastEvent(ev: SessionEvent, ctx: ToastContext) {
  const options = { id: `ev-${ev.id}` }
  const description = ctx.showName ? ctx.nameOf(ev.patientId) : undefined
  switch (ev.kind) {
    case 'result-ready': {
      const kind: Kind = ev.critical ? 'error' : ev.abnormal ? 'warning' : 'success'
      notify(kind, ev.label, { ...options, description, action: { label: ctx.st('toast.view'), onClick: () => ctx.openResults(ev.patientId) } })
      break
    }
    case 'arrival':
      if (ev.atSec > 0) notify('info', ev.label, { ...options, action: { label: ctx.st('toast.view'), onClick: () => ctx.selectPatient(ev.patientId) } })
      break
    case 'stage':
      notify(ev.level === 'critical' ? 'error' : 'warning', ev.label, { ...options, duration: 7000, action: { label: ctx.st('toast.view'), onClick: () => ctx.selectPatient(ev.patientId) } })
      break
    case 'death':
      notify('error', ev.label, { ...options, duration: 9000 })
      break
    case 'stage-averted':
      notify('success', ev.label, options)
      break
    case 'time-up':
      notify('warning', ctx.st('toast.timeUp'), options)
      break
    default:
      break
  }
}
