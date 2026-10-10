// Deterministic fictional class ("Data contoh"). Every score is a real output of grade() over a
// scripted log that was degraded per dimension from a seeded ability profile. No Math.random.

import { ALL_CASES } from '@/features/cases/data'
import { DIMENSIONS } from '@/features/cases/types'
import type { Case, Dimension, EncounterLog } from '@/features/cases/types'
import { grade } from '@/features/grading/grade'
import { buildScriptedLog, type ScriptKind } from '@/features/grading/scripted-logs'
import type { ClassAttempt, ClassMeta, ClassStudent } from './types'

export const CLASS_SEED = 20261010
export const WEEK_COUNT = 10
/** First Monday of the 10 week window and the fixed "now" of the mock class. */
export const WINDOW_START = Date.UTC(2026, 7, 3)
export const AS_OF = Date.UTC(2026, 9, 10, 17, 0)
const DAY_MS = 86_400_000

export const CLASS_META: ClassMeta = {
  faculty: 'Fakultas Kedokteran Nusantara Medika (fiktif)',
  program: 'Profesi Dokter, stase Penyakit Dalam',
  cohort: 'Angkatan 2022',
  className: 'Skills Lab Kelompok A',
  studentCount: 36,
  weekCount: WEEK_COUNT,
  asOf: new Date(AS_OF).toISOString(),
}

const NAMES = [
  'Aulia Rahmawati', 'Bagas Prasetyo', 'Citra Maharani', 'Dimas Anggoro', 'Eka Putri Lestari', 'Fajar Nugraha',
  'Gita Permatasari', 'Hafizh Ramadhan', 'Indah Kusumawardani', 'Johannes Silalahi', 'Kirana Dewanti',
  'Lukman Hakim Siregar', 'Maya Anggraini', 'Nadya Sihombing', 'Oktavianus Wenda', 'Putu Ayu Wirasari',
  'Qori Zahira', 'Rizky Maulana', 'Sekar Ayuningtyas', 'Taufik Hidayat Lubis', 'Utari Handayani', 'Valdy Pangestu',
  'Wulan Purnamasari', 'Yusuf Abdurrahman', 'Zahra Nabila', 'Andhika Saputra', 'Bunga Larasati', 'Cahyo Wibisono',
  'Dewi Kartika Sari', 'Erlangga Mahendra', 'Fitri Tanjung', 'Galih Nurcahyo', 'Hana Pertiwi', 'Ilham Syahputra',
  'Jessica Tarigan', 'Kadek Dwipayana',
]

/** Small seeded PRNG (mulberry32). */
export function createRng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const gauss = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next())
  return { next, gauss }
}
type Rng = ReturnType<typeof createRng>

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

type Engagement = 'steady' | 'sporadic' | 'dropped' | 'late'

interface Profile {
  ability: number
  offsets: Record<Dimension, number>
  engagement: Engagement
  firstWeek: number
  lastWeek: number
  /** Case ids this student never tried. */
  skipped: string[]
}

function makeProfile(rng: Rng): Profile {
  const ability = clamp(0.55 + 0.17 * rng.gauss(), 0.3, 0.95)
  const offsets = {} as Record<Dimension, number>
  for (const d of DIMENSIONS) offsets[d] = 0.09 * rng.gauss()
  offsets[DIMENSIONS[Math.floor(rng.next() * DIMENSIONS.length)]!] -= 0.17
  const roll = rng.next()
  const engagement: Engagement = roll < 0.68 ? 'steady' : roll < 0.8 ? 'sporadic' : roll < 0.88 ? 'dropped' : 'late'
  const firstWeek = engagement === 'late' ? 4 + Math.floor(rng.next() * 3) : 1
  const lastWeek = engagement === 'dropped' ? 3 + Math.floor(rng.next() * 5) : WEEK_COUNT
  const skipped: string[] = []
  if (rng.next() < 0.5) {
    const pool = shuffled(ALL_CASES, rng)
    skipped.push(...pool.slice(0, 1 + Math.floor(rng.next() * 2)).map((c) => c.id))
  }
  return { ability, offsets, engagement, firstWeek, lastWeek, skipped }
}

function weeklyAttempts(p: Profile, week: number, rng: Rng): number {
  if (week < p.firstWeek || week > p.lastWeek) return 0
  if (p.engagement === 'sporadic') return rng.next() < 0.55 ? 1 : 0
  return (rng.next() < 0.8 ? 1 : 0) + (rng.next() < 0.3 ? 1 : 0) + (rng.next() < 0.08 ? 1 : 0)
}

/** Drops parts of a perfect or average script per dimension so scores vary like real students. */
function degrade(log: EncounterLog, drop: Record<Dimension, number>, trustTarget: number, rng: Rng): EncounterLog {
  const keep = (p: number) => rng.next() >= p
  const next: EncounterLog = {
    ...log,
    askedIds: log.askedIds.filter(() => keep(drop.anamnesis)),
    exams: log.exams.filter(() => keep(drop.pemeriksaan)),
    orders: log.orders.filter(() => keep(drop.penalaran)),
    treatments: log.treatments.filter(() => keep(drop.terapi)),
    chat: log.chat.filter((m) => m.who === 'patient' || keep(drop.komunikasi)),
    diagnosisId: keep(drop.penalaran * 0.6) ? log.diagnosisId : null,
    dispositionId: keep(drop.terapi * 0.5) ? log.dispositionId : null,
    checklist: {
      sum: log.checklist.sum && keep(drop.keselamatan),
      safe: log.checklist.safe && keep(drop.keselamatan),
      ice: log.checklist.ice && keep(drop.komunikasi),
    },
    triage: log.triage && keep(drop.keselamatan * 0.7) ? log.triage : undefined,
  }
  const trace = log.emotionTrace.map((pt, i, arr) => (i === arr.length - 1 ? { ...pt, trust: trustTarget } : pt))
  return { ...next, emotionTrace: trace }
}

function attemptDate(week: number, rng: Rng): number {
  const weekend = rng.next() < 0.12
  const maxDay = week === WEEK_COUNT ? 5 : 6
  const day = Math.min(maxDay, weekend ? 5 + Math.floor(rng.next() * 2) : Math.floor(rng.next() * 5))
  const hour = 8 + Math.floor(rng.next() * 13)
  const minute = Math.floor(rng.next() * 60)
  const at = WINDOW_START + (week - 1) * 7 * DAY_MS + day * DAY_MS + hour * 3_600_000 + minute * 60_000
  return Math.min(at, AS_OF - (1 + minute) * 60_000)
}

function shuffled<T>(list: readonly T[], rng: Rng): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function initialsOf(name: string) {
  const parts = name.split(' ')
  return (parts[0]![0]! + (parts.length > 1 ? parts[parts.length - 1]![0]! : '')).toUpperCase()
}

function buildStudent(index: number, rng: Rng): ClassStudent {
  const id = `s${String(index + 1).padStart(2, '0')}`
  const name = NAMES[index]!
  const profile = makeProfile(rng)
  const attempts: ClassAttempt[] = []
  let queue: Case[] = []

  for (let week = 1; week <= WEEK_COUNT; week++) {
    const count = weeklyAttempts(profile, week, rng)
    for (let n = 0; n < count; n++) {
      if (queue.length === 0) queue = shuffled(ALL_CASES.filter((c) => !profile.skipped.includes(c.id)), rng)
      const kase = queue.shift()!
      const ability = clamp(profile.ability + 0.016 * (week - 1), 0.1, 0.97)
      const s = ability + 0.12 * rng.gauss()
      const kind: ScriptKind = s > 0.5 ? 'perfect' : s > 0.26 ? 'average' : 'bad'
      const drop = {} as Record<Dimension, number>
      for (const d of DIMENSIONS) {
        const dimAbility = clamp(ability + profile.offsets[d], 0.05, 1)
        drop[d] = clamp(0.7 * (1 - dimAbility) - 0.1 + 0.06 * rng.next(), 0, 0.7)
      }
      const base = buildScriptedLog(kase, kind)
      const trust = clamp(Math.round(30 + 62 * clamp(ability + profile.offsets.komunikasi, 0, 1) + 8 * rng.gauss()), 12, 95)
      const log = kind === 'bad' ? base : degrade(base, drop, trust, rng)
      const evaluation = grade(log, kase)
      const at = attemptDate(week, rng)
      attempts.push({
        id: `${id}-a${attempts.length + 1}`,
        studentId: id,
        caseId: kase.id,
        at: new Date(at).toISOString(),
        week,
        durationSec: Math.max(240, (log.endedAtSec ?? 0) * 6 + Math.round(120 * rng.next())),
        evaluation,
      })
    }
  }
  attempts.sort((a, b) => a.at.localeCompare(b.at))
  return { id, name, initials: initialsOf(name), nim: `FKNM-22-${String(index + 1).padStart(3, '0')}`, attempts }
}

/** Builds the 36 fictional students from scratch. Same output on every call. */
export function generateMockClass(): ClassStudent[] {
  const rng = createRng(CLASS_SEED)
  return NAMES.map((_, i) => buildStudent(i, rng))
}

let cache: ClassStudent[] | null = null

/** Memoised `generateMockClass()` for the repository. */
export function buildMockClass(): ClassStudent[] {
  cache ??= generateMockClass()
  return cache
}
