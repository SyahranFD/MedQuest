import { useCallback, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClayCluster, ClayGallery, ClayHero, ClayObjectCard, type ClayStats } from '@/features/landing-3d'
import { TRIANGLES_PER_OBJECT, TRIANGLES_PER_SCENE, countTriangles, type ClayQuality } from '@/features/landing-3d/budget'
import { buildClayObject, CLAY_OBJECT_NAMES } from '@/features/landing-3d/objects/builders'
import { readClayPalette } from '@/lib/clay-palette'

export const Route = createFileRoute('/lab/clay')({ component: LabClay })

const COPY = {
  title: 'Clay lab',
  intro: 'Procedural clay toolkit for the landing page. Dev route, not linked anywhere.',
  reduced: 'Reduced motion (override)',
  hero: 'ClayHero',
  rail: "ClayCluster variant 'rail'",
  cta: "ClayCluster variant 'cta'",
  cards: 'ClayObjectCard',
  objects: 'All objects',
  totals: 'Per-object triangles (high / low quality)',
  budget: `Budget: ${TRIANGLES_PER_OBJECT} per object, ${TRIANGLES_PER_SCENE} per scene`,
}

function StatLine({ stats }: { stats?: ClayStats }) {
  return (
    <p className="font-mono text-[12px] text-ink-3">
      {stats ? `${stats.triangles} triangles, ${stats.calls} draw calls (last frame)` : 'measuring'}
    </p>
  )
}

function Section({ title, stats, children }: { title: string; stats?: ClayStats; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-heading-section font-bold text-ink-1">{title}</h2>
      {children}
      {stats !== undefined && <StatLine stats={stats} />}
    </section>
  )
}

function LabClay() {
  const [reduced, setReduced] = useState(false)
  const [stats, setStats] = useState<Record<string, ClayStats>>({})
  const report = useCallback((key: string) => (s: ClayStats) => setStats((prev) => (prev[key]?.triangles === s.triangles && prev[key]?.calls === s.calls ? prev : { ...prev, [key]: s })), [])
  const handlers = useMemo(
    () => ({ hero: report('hero'), gallery: report('gallery'), rail: report('rail'), cta: report('cta'), card: report('card') }),
    [report],
  )

  const perObject = useMemo(() => {
    const palette = readClayPalette()
    const rows = CLAY_OBJECT_NAMES.map((name) => {
      const count = (quality: ClayQuality) => {
        const g = buildClayObject(name, palette, quality)
        const n = countTriangles(g)
        g.dispose()
        return n
      }
      return { name, high: count('high'), low: count('low') }
    })
    return { rows, total: rows.reduce((sum, r) => sum + r.high, 0) }
  }, [])

  return (
    <main id="main" className="mx-auto flex max-w-[var(--mq-container)] flex-col gap-14 px-6 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-heading-page font-bold text-ink-1">{COPY.title}</h1>
        <p className="text-ink-2">{COPY.intro}</p>
        <label className="flex w-fit min-h-11 items-center gap-3 text-ink-1">
          <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} className="size-5 accent-[var(--mq-primary)]" />
          {COPY.reduced}
        </label>
      </header>

      <Section title={COPY.hero} stats={stats.hero}>
        <div className="aspect-[16/11] w-full max-w-[780px] rounded-[var(--mq-radius-xl)] bg-surface">
          <ClayHero reducedMotion={reduced} onStats={handlers.hero} />
        </div>
      </Section>

      <Section title={COPY.objects} stats={stats.gallery}>
        <div className="aspect-[16/11] w-full max-w-[1100px]">
          <ClayGallery reducedMotion={reduced} onStats={handlers.gallery} />
        </div>
        <p className="text-ink-2">{COPY.budget}</p>
        <p className="font-mono text-[12px] text-ink-3">{COPY.totals}</p>
        <ul className="grid grid-cols-2 gap-x-6 font-mono text-[12px] text-ink-2 sm:grid-cols-4">
          {perObject.rows.map((r) => (
            <li key={r.name}>{`${r.name}: ${r.high} / ${r.low}`}</li>
          ))}
        </ul>
        <p className="font-mono text-[12px] text-ink-1">{`Sum of the 11 objects (high): ${perObject.total} triangles`}</p>
      </Section>

      <div className="grid gap-10 md:grid-cols-2">
        <Section title={COPY.rail} stats={stats.rail}>
          <div className="aspect-[2/1] w-full">
            <ClayCluster variant="rail" reducedMotion={reduced} onStats={handlers.rail} />
          </div>
        </Section>
        <Section title={COPY.cta} stats={stats.cta}>
          <div className="aspect-[2/1] w-full">
            <ClayCluster variant="cta" reducedMotion={reduced} onStats={handlers.cta} />
          </div>
        </Section>
      </div>

      <Section title={COPY.cards} stats={stats.card}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <ClayObjectCard object="stethoscope" tint="blue" reducedMotion={reduced} onStats={handlers.card} />
          <ClayObjectCard object="clipboard" tint="green" reducedMotion={reduced} />
          <ClayObjectCard object="heart" tint="coral" reducedMotion={reduced} />
        </div>
      </Section>
    </main>
  )
}
