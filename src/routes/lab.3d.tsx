import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { ClinicSceneLazy, type SceneShot, type SceneStats } from '@/features/clinic-3d'
import { EMOTIONS, type Emotion, type PatientPose, type PatientVisual } from '@/lib/emotion'
import type { SceneMode, SceneQuality, ScenePatient } from '@/lib/scene-contract'

export const Route = createFileRoute('/lab/3d')({
  component: Lab3d,
})

// Developer lab for the 3D clinic. Plain HTML controls on purpose; not a product screen.
const L = {
  title: 'Lab 3D klinik',
  mode: 'Mode',
  shot: 'Bidikan kamera',
  quality: 'Kualitas',
  reduced: 'Kurangi gerak',
  adaptive: 'Kualitas adaptif',
  add: 'Tambah pasien',
  remove: 'Hapus pasien aktif',
  patient: 'Pasien aktif',
  emotion: 'Emosi',
  intensity: 'Intensitas',
  talking: 'Bicara',
  pose: 'Pose',
  gender: 'Jenis kelamin',
  age: 'Usia',
  seed: 'Seed',
  status: 'Label status',
  stats: 'Pengukuran renderer',
  log: 'Catat ke konsol',
}

const POSES: PatientPose[] = ['sitting', 'lying', 'standing', 'walking']
const SHOTS: SceneShot[] = ['wide', 'medium', 'face']

function makePatient(n: number, mode: SceneMode): ScenePatient {
  const visual: PatientVisual = {
    seed: `lab-${n}`,
    age: [34, 58, 9, 71][n % 4],
    gender: n % 2 ? 'F' : 'M',
    emotion: 'netral',
    intensity: 0.8,
    talking: false,
    pose: mode === 'er' ? 'lying' : 'sitting',
  }
  return { id: `p${n}`, bedIndex: n % 3, visual, statusLabel: mode === 'er' ? ['Kritis', 'Stabil', 'Observasi'][n % 3] : undefined }
}

const fieldClass = 'rounded-sm border border-line-strong bg-surface px-3 py-2 text-body-s text-ink-1'
const buttonClass =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-line-strong px-4 text-body-s font-medium text-ink-1 hover:bg-panel'

function Lab3d() {
  const [mode, setMode] = useState<SceneMode>('poli')
  const [shot, setShot] = useState<SceneShot>('medium')
  const [quality, setQuality] = useState<SceneQuality>('high')
  const [reduced, setReduced] = useState(false)
  const [adaptive, setAdaptive] = useState(true)
  const [patients, setPatients] = useState<ScenePatient[]>(() => [makePatient(0, 'poli')])
  const [activeId, setActiveId] = useState<string | null>('p0')
  const [counter, setCounter] = useState(1)
  const [stats, setStats] = useState<SceneStats | null>(null)

  const active = patients.find((p) => p.id === activeId) ?? null

  const patchActive = useCallback(
    (patch: Partial<PatientVisual>) =>
      setPatients((list) => list.map((p) => (p.id === activeId ? { ...p, visual: { ...p.visual, ...patch } } : p))),
    [activeId],
  )

  const changeMode = (next: SceneMode) => {
    setMode(next)
    const first = makePatient(0, next)
    setPatients([first])
    setActiveId(first.id)
    setCounter(1)
  }

  const add = () => {
    const p = makePatient(counter, mode)
    setCounter((c) => c + 1)
    setPatients((list) => (list.length >= 4 ? list : [...list, p]))
    setActiveId(p.id)
  }

  const remove = () => {
    if (!activeId) return
    setPatients((list) => {
      const next = list.filter((p) => p.id !== activeId)
      setActiveId(next[0]?.id ?? null)
      return next
    })
  }

  const onStats = useCallback((s: SceneStats) => setStats(s), [])

  return (
    <main id="main" className="mx-auto grid max-w-[1240px] gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section aria-label="Pratinjau" className="relative h-[68dvh] min-h-96 overflow-hidden rounded-lg border border-line bg-panel lg:h-[calc(100dvh-3rem)]">
        <ClinicSceneLazy
          mode={mode}
          patients={patients}
          activePatientId={activeId}
          onSelectPatient={setActiveId}
          quality={quality}
          reducedMotion={reduced}
          adaptive={adaptive}
          shot={shot}
          onStats={onStats}
        />
      </section>

      <form className="grid content-start gap-4" onSubmit={(e) => e.preventDefault()}>
        <h1 className="font-display text-heading-card font-bold text-ink-1">{L.title}</h1>

        <label className="grid gap-1 text-body-s text-ink-2">
          {L.mode}
          <select className={fieldClass} value={mode} onChange={(e) => changeMode(e.target.value as SceneMode)}>
            <option value="poli">Poli</option>
            <option value="er">IGD</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-body-s text-ink-2">
            {L.shot}
            <select className={fieldClass} value={shot} onChange={(e) => setShot(e.target.value as SceneShot)}>
              {SHOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-body-s text-ink-2">
            {L.quality}
            <select className={fieldClass} value={quality} onChange={(e) => setQuality(e.target.value as SceneQuality)}>
              <option value="high">high</option>
              <option value="low">low</option>
            </select>
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-body-s text-ink-1">
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
          {L.reduced}
        </label>

        <label className="flex min-h-11 items-center gap-2 text-body-s text-ink-1">
          <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} />
          {L.adaptive}
        </label>

        <div className="flex gap-2">
          <button type="button" className={buttonClass} onClick={add} disabled={patients.length >= 4}>
            {L.add}
          </button>
          <button type="button" className={buttonClass} onClick={remove} disabled={!active}>
            {L.remove}
          </button>
        </div>

        <label className="grid gap-1 text-body-s text-ink-2">
          {L.patient}
          <select className={fieldClass} value={activeId ?? ''} onChange={(e) => setActiveId(e.target.value || null)}>
            <option value="">-</option>
            {patients.map((p, i) => (
              <option key={p.id} value={p.id}>
                {`#${i + 1} ${p.visual.seed}`}
              </option>
            ))}
          </select>
        </label>

        {active && (
          <fieldset className="grid gap-3 rounded-md border border-line p-3">
            <label className="grid gap-1 text-body-s text-ink-2">
              {L.emotion}
              <select className={fieldClass} value={active.visual.emotion} onChange={(e) => patchActive({ emotion: e.target.value as Emotion })}>
                {EMOTIONS.map((emotion) => (
                  <option key={emotion} value={emotion}>
                    {emotion}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-body-s text-ink-2">
              {`${L.intensity}: ${active.visual.intensity.toFixed(2)}`}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={active.visual.intensity}
                onChange={(e) => patchActive({ intensity: Number(e.target.value) })}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 text-body-s text-ink-1">
              <input type="checkbox" checked={active.visual.talking} onChange={(e) => patchActive({ talking: e.target.checked })} />
              {L.talking}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-body-s text-ink-2">
                {L.pose}
                <select className={fieldClass} value={active.visual.pose} onChange={(e) => patchActive({ pose: e.target.value as PatientPose })}>
                  {POSES.map((pose) => (
                    <option key={pose} value={pose}>
                      {pose}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-body-s text-ink-2">
                {L.gender}
                <select className={fieldClass} value={active.visual.gender} onChange={(e) => patchActive({ gender: e.target.value as 'M' | 'F' })}>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </label>
              <label className="grid gap-1 text-body-s text-ink-2">
                {L.age}
                <input
                  className={fieldClass}
                  type="number"
                  min={1}
                  max={95}
                  value={active.visual.age}
                  onChange={(e) => patchActive({ age: Number(e.target.value) || 30 })}
                />
              </label>
              <label className="grid gap-1 text-body-s text-ink-2">
                {L.seed}
                <input className={fieldClass} value={active.visual.seed} onChange={(e) => patchActive({ seed: e.target.value })} />
              </label>
            </div>
            <label className="grid gap-1 text-body-s text-ink-2">
              {L.status}
              <input
                className={fieldClass}
                value={active.statusLabel ?? ''}
                onChange={(e) =>
                  setPatients((list) => list.map((p) => (p.id === activeId ? { ...p, statusLabel: e.target.value || undefined } : p)))
                }
              />
            </label>
          </fieldset>
        )}

        <section aria-label={L.stats} className="rounded-md border border-line bg-surface p-3 text-body-s text-ink-2">
          <h2 className="mb-1 font-semibold text-ink-1">{L.stats}</h2>
          <output data-testid="stats" className="grid gap-0.5 font-mono text-label" aria-live="off">
            <span>{`triangles: ${stats?.triangles ?? '-'}`}</span>
            <span>{`draw calls: ${stats?.drawCalls ?? '-'}`}</span>
            <span>{`geometries: ${stats?.geometries ?? '-'}`}</span>
            <span>{`quality: ${stats?.quality ?? '-'}  dpr: ${stats?.dpr.toFixed(2) ?? '-'}`}</span>
          </output>
          <button
            type="button"
            className={`${buttonClass} mt-2`}
            onClick={() => console.info('[clinic-3d] renderer.info', stats)}
          >
            {L.log}
          </button>
        </section>
      </form>
    </main>
  )
}
