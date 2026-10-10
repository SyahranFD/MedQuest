import { Link, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Eye, Flag } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Toaster } from 'sonner'
import { EmptyState } from '@/components/page/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { ClinicSceneLazy } from '@/features/clinic-3d'
import { requireCase } from '@/features/cases/repository'
import type { Zone } from '@/features/cases/types'
import { selectScenePatients, selectShiftFailed, selectShiftOver, useSessionStore } from '@/features/session/store'
import { RESOLVED_STATUSES, type ActionResult, type Session, type SessionEvent } from '@/features/session/types'
import { spring, useReducedMotion } from '@/lib/motion'
import { useUiStore } from '@/stores/ui'
import { BottomSheet, PEEK_PX, sheetVisiblePx, useIsDesktop, useViewportHeight, type SheetSnap } from './bottom-sheet'
import { EndSessionDialog, type Checklist } from './end-session-dialog'
import { PanelBody, PanelTabList, type PanelActions, type PanelTab } from './encounter-panel'
import { BedStrip, ClockChip, PatientDock } from './er-controls'
import { isTypingTarget } from './anamnesis-panel'
import { SettingsButton } from './settings-dialog'
import { finishSession } from './session-flow'
import { notify, SIM_TOASTER, toastEvent } from './session-toasts'
import { EdgeTint, TrustHud } from './trust-hud'
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

  const [tab, setTab] = useState<PanelTab>('anamnesis')
  const [snap, setSnap] = useState<SheetSnap>('peek')
  const [focusToken, setFocusToken] = useState(0)
  const [endOpen, setEndOpen] = useState(false)
  const [ending, setEnding] = useState(false)

  const patient = activeId ? session.patients[activeId] : undefined
  const caseDef = patient ? requireCase(patient.caseId) : undefined
  const isEr = session.mode === 'er'
  const resolved = !!patient && RESOLVED_STATUSES.includes(patient.status)
  const vh = useViewportHeight()
  const peekPx = isEr ? PEEK_PX + 84 : PEEK_PX
  /** Phones stack the trust HUD above the scene so it never covers the face. */
  const hudInset = patient && patient.status !== 'upcoming' ? (resolved ? 124 : snap === 'peek' ? 172 : 146) : 56
  /** On phones the stage is the part of the screen above the sheet, so the patient stays in view. */
  const inset = isDesktop ? 0 : Math.min(sheetVisiblePx(snap, vh, peekPx), vh * 0.6)

  const store = useSessionStore
  const select = useCallback((id: string | null) => store.getState().selectPatient(id), [store])

  // ---------- clock and toasts ----------
  const openResults = useCallback(
    (patientId: string) => {
      select(patientId)
      setTab('orders')
      setSnap((s) => (s === 'peek' ? 'half' : s))
    },
    [select],
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
          selectPatient: select,
        })
      }
    },
    [st, store, openResults, select],
  )
  useSessionClock(session.status === 'active' && !ending && !over && !endOpen, onEvents)

  // ---------- keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (document.querySelector('[role="dialog"]')) return
      e.preventDefault()
      setTab('anamnesis')
      setSnap((s) => (s === 'peek' ? 'half' : s))
      setFocusToken((t) => t + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

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
    setTab('anamnesis')
  }
  const triage = (zone: Zone) => {
    const r = store.getState().triage(pid, zone)
    if (!r.ok) return
    notify(r.correct ? 'success' : 'warning', st(r.correct ? 'toast.triageOk' : 'toast.triageOff'), { description: r.text })
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

  const tabsHeader = (
    <PanelTabList unseenResults={unseenResults} onPress={() => setSnap((s) => (s === 'peek' ? 'half' : s))} className="bg-transparent lg:bg-panel" />
  )
  const body =
    patient && caseDef ? (
      <PanelBody caseDef={caseDef} session={session} patient={patient} actions={actions} focusToken={focusToken} />
    ) : (
      <p className="text-body-s text-ink-2">{st('panel.pick')}</p>
    )

  const stripRow = (
    <div className="flex items-end gap-2">
      <BedStrip session={session} selectedId={activeId} onSelect={select} className="min-w-0 flex-1" />
      <Button variant="secondary" size="icon" className="mb-1 shrink-0" aria-label={st('beds.overview')} onClick={() => select(null)}>
        <Eye aria-hidden="true" />
      </Button>
    </div>
  )

  const stage = (
    <section aria-label={st('stage.label')} className="relative min-h-0 flex-1 overflow-hidden bg-panel">
      <div className="absolute inset-x-0" style={{ top: isDesktop ? 0 : hudInset, bottom: inset }}>
      <ClinicSceneLazy
        className="absolute inset-0"
        mode={session.mode}
        patients={scenePatients}
        activePatientId={activeId}
        onSelectPatient={select}
        shot={isEr && !activeId ? 'wide' : !isDesktop && snap !== 'peek' ? 'face' : 'medium'}
        quality={quality === 'lite' ? 'low' : 'high'}
        adaptive={quality === 'auto'}
        reducedMotion={reduced}
      />
      </div>
      <EdgeTint feedback={feedback} />

      <div
        className="pointer-events-none absolute inset-0 z-20 flex flex-col gap-3 p-3 sm:p-4 [&>*]:pointer-events-auto"
        style={{ paddingBottom: `calc(${inset}px + 0.75rem)` }}
      >
        <div className="flex items-center justify-between gap-2 !pointer-events-none [&>*]:pointer-events-auto">
          <div className="hidden min-w-0 max-w-[20rem] items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1.5 sm:flex">
            <Badge variant="neutral">{st(isEr ? 'mode.er' : 'mode.poli')}</Badge>
            <span aria-hidden="true" className="truncate text-body-s font-semibold text-ink-1">{caseDef?.title ?? st('stage.noPatient')}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ClockChip session={session} patientId={activeId} onSpeed={(v) => store.getState().setSpeed(v)} />
            <SettingsButton className="rounded-full border border-line bg-surface" />
            <Button variant="secondary" className="bg-surface" onClick={() => setEndOpen(true)} data-testid="end-session">
              <Flag aria-hidden="true" />
              <span className={isEr ? 'max-sm:sr-only' : undefined}>{st('end.button')}</span>
            </Button>
          </div>
        </div>

        {patient && caseDef && resolved && (
          <p role="status" className="w-full rounded-md border border-line bg-surface p-3 text-body-s text-ink-1 sm:w-[22rem]" data-testid="patient-resolved">
            {st(patient.status === 'deceased' ? 'stage.deceased' : 'stage.resolved')}
          </p>
        )}
        {patient && caseDef && patient.status !== 'upcoming' && !resolved && (
          <TrustHud
            className="w-full sm:w-[22rem]"
            compact={!isDesktop}
            hideReason={!isDesktop && snap !== 'peek'}
            trust={patient.emotion.trust}
            mood={patient.emotion.mood}
            talking={fb.talkingId === patient.id}
            feedback={feedback}
          />
        )}

        <div className="mt-auto flex flex-col gap-2">
          {over && (
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3.5" data-testid="shift-over">
              <p className="text-body-s font-medium text-ink-1">{st(failed ? 'shift.failed' : 'shift.over')}</p>
              <Button onClick={() => setEndOpen(true)}>{st('shift.cta')}</Button>
            </div>
          )}
          {lastReply && patient && !resolved && (isDesktop || snap === 'peek') && (
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
          {isEr && isDesktop && stripRow}
        </div>
      </div>
    </section>
  )

  const dock = isEr && patient && (
    <PatientDock session={session} patientId={patient.id} onAssign={assign} onTriage={triage} />
  )

  return (
    <main id="main" className="relative flex h-dvh w-full flex-col overflow-hidden bg-ground lg:grid lg:grid-cols-[minmax(0,1fr)_27rem] lg:grid-rows-[minmax(0,1fr)]">
      <h1 className="sr-only">{caseDef?.title ?? st('stage.noPatient')}</h1>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as PanelTab)
          setSnap((s) => (s === 'peek' ? 'half' : s))
        }}
        className="contents"
      >
        {stage}
        {isDesktop ? (
          <aside aria-label={st('panel.label')} className="flex min-h-0 flex-col border-l border-line bg-surface">
            <div className="flex flex-col gap-3 border-b border-line p-3">
              {dock}
              {tabsHeader}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{body}</div>
          </aside>
        ) : (
          <BottomSheet
            snap={snap}
            peekPx={peekPx}
            onSnap={setSnap}
            header={
              <div className="flex flex-col gap-2 px-3 pb-2">
                {isEr && stripRow}
                {tabsHeader}
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              {dock}
              {body}
            </div>
          </BottomSheet>
        )}
      </Tabs>

      <Toaster
        id={SIM_TOASTER}
        containerAriaLabel={st('toast.region')}
        position={isDesktop ? 'top-left' : 'bottom-center'}
        offset={{ top: 248, left: 16 }}
        mobileOffset={{ bottom: inset + 12, left: 12, right: 12 }}
        style={{ '--width': '320px' } as CSSProperties}
      />
      <EndSessionDialog open={endOpen} onOpenChange={setEndOpen} session={session} busy={ending} onConfirm={confirmEnd} />
    </main>
  )
}
