import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Eye, Flag } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Toaster } from 'sonner'
import { EmptyState } from '@/components/page/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClinicSceneLazy } from '@/features/clinic-3d'
import { requireCase } from '@/features/cases/repository'
import type { Zone } from '@/features/cases/types'
import { selectScenePatients, selectShiftFailed, selectShiftOver, useSessionStore } from '@/features/session/store'
import { RESOLVED_STATUSES, type ActionResult, type Session, type SessionEvent } from '@/features/session/types'
import { spring, useReducedMotion } from '@/lib/motion'
import { useUiStore } from '@/stores/ui'
import { useIsDesktop } from './bottom-sheet'
import { BedPlacement } from './bed-placement'
import { DoctorTablet } from './doctor-tablet'
import { EndSessionDialog, type Checklist } from './end-session-dialog'
import { PANEL_TABS, PanelBody, type PanelActions, type PanelTab } from './encounter-panel'
import { BedStrip, ClockChip, PatientDock } from './er-controls'
import { HudDock } from './hud-dock'
import { isTypingTarget } from './anamnesis-panel'
import { SettingsButton } from './settings-dialog'
import { finishSession } from './session-flow'
import { notify, SIM_TOASTER, toastEvent } from './session-toasts'
import { EdgeTint } from './trust-hud'
import { TrustPill } from './trust-pill'
import { useEncounterFeedback } from './use-encounter-feedback'
import { useSessionClock } from './use-session-clock'
import { useST } from './use-st'
import { CASES_PATH } from './links'

/** Keep the previous value while the signature is unchanged, so the 3D props stay referentially stable between ticks. */
function useStableBy<T>(value: T, signature: string): T {
  const [held, setHeld] = useState({ signature, value })
  if (held.signature === signature) return held.value
  setHeld({ signature, value })
  return value
}

export function EncounterScreen({ sessionId }: { sessionId: string }) {
  const st = useST()
  const session = useSessionStore((s) => s.session)
  if (!session || session.id !== sessionId || session.status !== 'active') {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-ground p-6">
        <EmptyState
          title={st('session.missing.title')}
          description={st('session.missing.body')}
          action={
            <Button asChild>
              <Link to={CASES_PATH}>{st('session.missing.cta')}</Link>
            </Button>
          }
        />
      </main>
    )
  }
  return <Encounter session={session} />
}

function Encounter({ session }: { session: Session }) {
  const st = useST()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const isDesktop = useIsDesktop()
  const quality = useUiStore((s) => s.quality)
  const activeId = useSessionStore((s) => s.activePatientId)
  const over = useSessionStore(selectShiftOver)
  const failed = useSessionStore(selectShiftFailed)
  const fb = useEncounterFeedback()

  const pressedAt = useRef(0)
  const [tab, setTab] = useState<PanelTab>('anamnesis')
  const [open, setOpen] = useState(false)
  const [focusToken, setFocusToken] = useState(0)
  const [endOpen, setEndOpen] = useState(false)
  const [ending, setEnding] = useState(false)

  const patient = activeId ? session.patients[activeId] : undefined
  const caseDef = patient ? requireCase(patient.caseId) : undefined
  const isEr = session.mode === 'er'
  const resolved = !!patient && RESOLVED_STATUSES.includes(patient.status)
  const placing = isEr && patient?.status === 'waiting'
  const canOpen = !!patient
  const canTabs = canOpen && !placing

  const store = useSessionStore
  const select = useCallback((id: string | null) => store.getState().selectPatient(id), [store])

  // ---------- clock and toasts ----------
  const openResults = useCallback(
    (patientId: string) => {
      pressedAt.current = performance.now()
      select(patientId)
      setTab('orders')
      setOpen(true)
    },
    [select],
  )
  /** A press on a patient (3D, chip, toast): select and open the tablet at the right place. No bed yet: placement. In a bed or poli: Periksa. */
  const pressPatient = useCallback(
    (patientId: string) => {
      pressedAt.current = performance.now()
      select(patientId)
      const status = store.getState().session?.patients[patientId]?.status
      if (status === 'waiting') return setOpen(true)
      if (status !== 'in-bed') return
      setTab('exam')
      setOpen(true)
    },
    [select, store],
  )
  const onEvents = useCallback(
    (events: SessionEvent[]) => {
      const s = store.getState().session
      if (!s) return
      for (const ev of events) {
        toastEvent(ev, {
          st,
          showName: s.mode === 'er',
          nameOf: (id) => requireCase(s.patients[id]!.caseId).patient.name,
          openResults,
          selectPatient: pressPatient,
        })
      }
    },
    [st, store, openResults, pressPatient],
  )
  useSessionClock(session.status === 'active' && !ending && !over && !endOpen, onEvents)

  // ---------- dock and keyboard ----------
  /** A dock press or key 1 to 5: open that tab, or close the tablet when it is already the open one. */
  const press = useCallback(
    (next: PanelTab) => {
      if (open && tab === next) return setOpen(false)
      setTab(next)
      setOpen(true)
    },
    [open, tab],
  )
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!canTabs || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"]:not([data-tablet])')) return
      if (e.key === '/') {
        e.preventDefault()
        setTab('anamnesis')
        setOpen(true)
        setFocusToken((t) => t + 1)
        return
      }
      const next = PANEL_TABS[Number(e.key) - 1]
      if (!next) return
      e.preventDefault()
      press(next.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [canTabs, press])

  // ---------- actions ----------
  const pid = patient?.id ?? ''
  const actions: PanelActions = useMemo(() => {
    const s = () => store.getState()
    const emote = (r: ActionResult, reason?: string) => fb.apply(r, { reason })
    return {
      ask: (entryId) => {
        const interrupted = fb.isTalking(pid)
        fb.apply(s().askQuestion(pid, entryId, { interrupted }), { interrupted })
      },
      send: (text) => {
        const interrupted = fb.isTalking(pid)
        fb.apply(s().typeMessage(pid, text, { interrupted }), { interrupted })
      },
      examine: (examId) => {
        const r = s().examine(pid, examId)
        emote(r, r.trustDelta === undefined ? undefined : r.trustDelta > 0 ? 'examineConsent' : 'examineNoConsent')
      },
      order: (testId) => void s().orderTest(pid, testId),
      orderPanel: (ids) => ids.forEach((id) => void s().orderTest(pid, id)),
      markSeen: () => void s().receiveResults(pid, true),
      diagnose: (dx) => void s().diagnose(pid, dx),
      treat: (id, opts) => {
        const r = s().treat(pid, id, opts)
        if (!r.ok) return void notify('error', st('toast.treatFailed'))
        emote(r, r.trustDelta ? (r.trustDelta > 0 ? 'treatHelpful' : 'treatHarmful') : undefined)
        r.events?.forEach((ev) => toastEvent(ev, { st, showName: false, nameOf: () => '', openResults, selectPatient: select }))
      },
      dispose: (id) => {
        const r = s().dispose(pid, id)
        if (r.ok) notify('success', st('toast.disposed'))
      },
    }
  }, [fb, pid, store, st, openResults, select])

  const assign = (bedIndex: number) => {
    const r = store.getState().assignBed(pid, bedIndex)
    if (!r.ok) return void notify('error', st('toast.bedFull'))
    setTab('exam')
  }
  const triage = (zone: Zone) => {
    const r = store.getState().triage(pid, zone)
    if (!r.ok) return
    notify(r.correct ? 'success' : 'warning', st(r.correct ? 'toast.triageOk' : 'toast.triageOff'), { description: r.text })
  }

  const endSession = () => {
    setOpen(false)
    setEndOpen(true)
  }
  const confirmEnd = async (checklist: Checklist) => {
    setEnding(true)
    try {
      const s = store.getState().session!
      for (const id of s.order) {
        const p = s.patients[id]!
        if (p.status !== 'upcoming' && p.status !== 'waiting') store.getState().setChecklist(id, checklist)
      }
      const record = await finishSession()
      if (!record) throw new Error('no record')
      await navigate({ to: '/app/debrief/$sessionId', params: { sessionId: record.id } })
    } catch {
      setEnding(false)
      notify('error', st('end.error'))
    }
  }

  // ---------- derived view data ----------
  const rawScene = selectScenePatients(store.getState(), fb.talkingId)
  const signature = JSON.stringify(
    rawScene.map((p) => [p.id, p.bedIndex, p.statusLabel, p.statusTone, p.visual.emotion, Math.round(p.visual.intensity * 10), p.visual.talking, p.visual.pose]),
  )
  const stableScene = useStableBy(rawScene, signature)
  const scenePatients = useMemo(
    () => stableScene.map((p) => (p.statusLabel ? { ...p, statusLabel: st(`status.${p.statusLabel}`) } : p)),
    [stableScene, st],
  )

  const lastReply = patient?.log.chat.findLast((m) => m.who === 'patient')?.text ?? caseDef?.greeting
  const unseenResults = patient ? patient.log.orders.filter((o) => o.readyAtSec <= session.nowSec && o.seenAtSec === undefined).length : 0
  const feedback = patient ? fb.feedback[patient.id] : undefined

  const body =
    patient && caseDef && placing ? (
      <BedPlacement session={session} patientId={patient.id} onAssign={assign} />
    ) : patient && caseDef ? (
      <PanelBody
        caseDef={caseDef}
        session={session}
        patient={patient}
        actions={actions}
        focusToken={focusToken}
        triage={isEr ? <PatientDock session={session} patientId={patient.id} onTriage={triage} /> : undefined}
      />
    ) : (
      <p className="p-5 text-body-s text-ink-2">{st('panel.pick')}</p>
    )

  return (
    <main id="main" className="relative h-dvh w-full overflow-hidden bg-panel">
      <h1 className="sr-only">{caseDef?.title ?? st('stage.noPatient')}</h1>
      <section aria-label={st('stage.label')} className="absolute inset-0">
        <ClinicSceneLazy
          className="absolute inset-0"
          mode={session.mode}
          patients={scenePatients}
          activePatientId={activeId}
          onSelectPatient={pressPatient}
          shot={isEr && !activeId ? 'wide' : 'medium'}
          quality={quality === 'lite' ? 'low' : 'high'}
          adaptive={quality === 'auto'}
          reducedMotion={reduced}
        />
        <EdgeTint feedback={feedback} />

        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col gap-2.5 p-3 sm:p-4 [&>*]:pointer-events-auto">
          <div className="flex items-center justify-between gap-2 !pointer-events-none [&>*]:pointer-events-auto">
            <div className="mq-translucent hidden min-w-0 max-w-[20rem] items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1.5 sm:flex">
              <Badge variant="neutral">{st(isEr ? 'mode.er' : 'mode.poli')}</Badge>
              <span aria-hidden="true" className="truncate text-body-s font-semibold text-ink-1">{caseDef?.title ?? st('stage.noPatient')}</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <ClockChip session={session} patientId={activeId} onSpeed={(v) => store.getState().setSpeed(v)} />
              <SettingsButton className="mq-translucent rounded-full border border-line" />
              <Button variant="secondary" className="mq-translucent" onClick={endSession} data-testid="end-session">
                <Flag aria-hidden="true" />
                <span className={isEr ? 'max-sm:sr-only' : undefined}>{st('end.button')}</span>
              </Button>
            </div>
          </div>

          {patient && caseDef && resolved && (
            <p role="status" className="mq-translucent w-full rounded-md border border-line p-3 text-body-s text-ink-1 sm:w-[22rem]" data-testid="patient-resolved">
              {st(patient.status === 'deceased' ? 'stage.deceased' : 'stage.resolved')}
            </p>
          )}
          {patient && caseDef && patient.status !== 'upcoming' && !resolved && (
            <TrustPill trust={patient.emotion.trust} mood={patient.emotion.mood} talking={fb.talkingId === patient.id} feedback={feedback} />
          )}
          {isEr && (
            <div className="flex items-center gap-2">
              <BedStrip compact session={session} selectedId={activeId} onSelect={pressPatient} className="min-w-0 pb-0" />
              <Button variant="secondary" size="icon" className="mq-translucent shrink-0 rounded-full" aria-label={st('beds.overview')} onClick={() => {
                  setOpen(false)
                  select(null)
                }}>
                <Eye aria-hidden="true" />
              </Button>
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3">
            {over && (
              <div role="status" className="mq-translucent flex flex-wrap items-center justify-between gap-3 rounded-md border border-line p-3.5" data-testid="shift-over">
                <p className="text-body-s font-medium text-ink-1">{st(failed ? 'shift.failed' : 'shift.over')}</p>
                <Button onClick={endSession}>{st('shift.cta')}</Button>
              </div>
            )}
            {lastReply && patient && !resolved && (
              <motion.p
                key={lastReply}
                role="status"
                data-testid="patient-bubble"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={reduced ? { duration: 0.2 } : spring.default}
                className="max-w-md self-start rounded-md rounded-bl-xs border border-line bg-surface px-3.5 py-2.5 text-body-s text-ink-1"
              >
                <span className="mb-0.5 block text-label font-semibold text-ink-muted">{caseDef?.patient.name}</span>
                {lastReply}
              </motion.p>
            )}
            <HudDock active={open && !placing ? tab : null} unseenResults={unseenResults} disabled={!canTabs} onPress={press} />
          </div>
        </div>
      </section>

      <DoctorTablet
        open={open}
        onOpenChange={setOpen}
        onSceneClick={() => performance.now() - pressedAt.current > 50 && setOpen(false)}
        tab={tab}
        onTabChange={setTab}
        unseenResults={unseenResults}
        title={caseDef ? `${caseDef.patient.name}, ${caseDef.patient.age}` : st('stage.noPatient')}
        placing={!!placing}
        sheet={!isDesktop}
      >
        {body}
      </DoctorTablet>

      <Toaster
        id={SIM_TOASTER}
        containerAriaLabel={st('toast.region')}
        position={isDesktop ? 'bottom-right' : 'top-center'}
        offset={{ bottom: 16, right: 16 }}
        mobileOffset={{ top: 64, left: 12, right: 12 }}
        style={{ '--width': '320px' } as CSSProperties}
      />
      <EndSessionDialog open={endOpen} onOpenChange={setEndOpen} session={session} busy={ending} onConfirm={confirmEnd} />
    </main>
  )
}
