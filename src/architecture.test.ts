// Architecture gate (CLAUDE.md rule 4.12). Each RULES row has a detector, one synthetic violator and
// one near-miss, so a detector that matches nothing cannot pass silently.
import { describe, expect, it } from 'vitest'

interface Source {
  /** Posix path relative to the project root, e.g. `src/components/ui/button.tsx`. */
  path: string
  text: string
}

interface Rule {
  id: string
  description: string
  detect: (file: Source) => string[]
  violator: Source
  nearMiss: Source
}

/** Files allowed to hold raw hex colour. 3D agents read the palette from CSS variables instead. */
const HEX_ALLOWLIST = [
  'src/index.css',
  'src/features/clinic-3d/',
  'src/features/landing-3d/',
  'src/lib/clay-palette.ts',
]

/** Minimal posix path helpers (no node types in the app tsconfig). */
const posix = {
  dirname: (p: string) => p.slice(0, Math.max(0, p.lastIndexOf('/'))),
  basename: (p: string) => p.slice(p.lastIndexOf('/') + 1),
  normalize(p: string) {
    const out: string[] = []
    for (const seg of p.split('/')) {
      if (seg === '..') out.pop()
      else if (seg !== '.' && seg !== '') out.push(seg)
    }
    return out.join('/')
  },
  join: (...parts: string[]) => parts.join('/'),
}

/**
 * Shared-library features (CLAUDE.md rule 4.4a). Any feature may import these, and they may import
 * only each other and lib/ components/ stores/. App features (landing, simulator, dashboard,
 * library, history) never import one another.
 * - training: the clinical engine (cases, dialogue, grading, session engine and store). One domain,
 *   so its four folders may import each other.
 * - 3d: pure-view scene toolkits that take props and emit callbacks (clinic-3d, landing-3d).
 */
const DOMAIN_GROUPS: Record<string, string> = {
  cases: 'training',
  dialogue: 'training',
  grading: 'training',
  session: 'training',
  'clinic-3d': '3d',
  'landing-3d': '3d',
}
const SHARED_GROUPS = new Set(['training', '3d'])

const groupOf = (feature: string) => DOMAIN_GROUPS[feature] ?? feature

const isTest = (path: string) => /\.test\.tsx?$/.test(path) || path.startsWith('src/test/')

/** Drops comments so prose mentioning `fetch(` or `#fff` does not trip a detector. */
function code(text: string) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

function lines(file: Source, pattern: RegExp, message: string) {
  return code(file.text)
    .split('\n')
    .flatMap((line, i) => (pattern.test(line) ? [`${file.path}:${i + 1} ${message}`] : []))
}

function importsOf(text: string) {
  return [...code(text).matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!)
}

/** Resolves an import specifier to a project-root-relative path, or null for packages. */
function resolveImport(from: string, spec: string) {
  if (spec.startsWith('@/')) return `src/${spec.slice(2)}`
  if (spec.startsWith('.')) return posix.normalize(posix.join(posix.dirname(from), spec))
  return null
}

const featureOf = (path: string) => /^src\/features\/([^/]+)\//.exec(path)?.[1]

export const RULES: Rule[] = [
  {
    id: 'fetch-only-in-lib',
    description: '`fetch(` appears only in src/lib (api.ts, put-file.ts)',
    detect: (f) =>
      f.path.startsWith('src/lib/') || isTest(f.path)
        ? []
        : lines(f, /(^|[^\w.])fetch\s*\(/, 'calls fetch( outside src/lib'),
    violator: { path: 'src/features/x/api.ts', text: "const r = await fetch('/x')" },
    nearMiss: { path: 'src/features/x/api.ts', text: "const r = await apiFetch('/x') // fetch(" },
  },
  {
    id: 'no-hex-outside-tokens',
    description: 'no hex colour literals outside index.css, the 3D features and the allowlist',
    detect: (f) =>
      HEX_ALLOWLIST.some((p) => f.path.startsWith(p)) || isTest(f.path)
        ? []
        : lines(f, /#[0-9a-fA-F]{3,8}\b/, 'hex literal (use a --mq-* token)'),
    violator: { path: 'src/components/ui/x.tsx', text: "const c = '#2a8266'" },
    nearMiss: { path: 'src/components/ui/x.tsx', text: "const href = '#main' // #2a8266" },
  },
  {
    id: 'no-upward-imports',
    description: 'components, lib and stores never import features',
    detect: (f) =>
      !/^src\/(components|lib|stores)\//.test(f.path) || isTest(f.path)
        ? []
        : importsOf(f.text)
            .filter((s) => resolveImport(f.path, s)?.startsWith('src/features/'))
            .map((s) => `${f.path} imports ${s} (upward)`),
    violator: { path: 'src/components/ui/x.tsx', text: "import { a } from '@/features/cases/api'" },
    nearMiss: { path: 'src/features/cases/x.tsx', text: "import { Button } from '@/components/ui/button'" },
  },
  {
    id: 'no-cross-feature-imports',
    description: 'a feature never imports another app feature (shared training and 3d features excepted)',
    detect: (f) => {
      const own = featureOf(f.path)
      if (!own || isTest(f.path)) return []
      return importsOf(f.text)
        .filter((s) => {
          const other = featureOf(`${resolveImport(f.path, s) ?? ''}/`)
          if (other === undefined || groupOf(other) === groupOf(own)) return false
          // shared features are importable by anyone; everything else stays isolated
          return !SHARED_GROUPS.has(groupOf(other))
        })
        .map((s) => `${f.path} imports ${s} (sideways)`)
    },
    violator: { path: 'src/features/a/x.ts', text: "import { k } from '@/features/b/keys'" },
    nearMiss: {
      path: 'src/features/a/x.ts',
      text: "import { k } from './keys'\nimport { u } from '../a/util'\nimport { c } from '@/lib/utils'",
    },
  },
  {
    id: 'no-inline-query-keys',
    description: '`queryKey: [` appears only in keys.ts',
    detect: (f) =>
      posix.basename(f.path) === 'keys.ts' || isTest(f.path)
        ? []
        : lines(f, /queryKey\s*:\s*\[/, 'inline queryKey (move to keys.ts)'),
    violator: { path: 'src/features/a/use-x.ts', text: "useQuery({ queryKey: ['x'], queryFn })" },
    nearMiss: { path: 'src/features/a/use-x.ts', text: 'useQuery({ queryKey: caseKeys.all, queryFn })' },
  },
  {
    id: 'no-mutation-in-components',
    description: '`useMutation` never appears under src/components',
    detect: (f) =>
      !f.path.startsWith('src/components/') || isTest(f.path)
        ? []
        : lines(f, /\buseMutation\b/, 'useMutation in components/ (belongs in a feature hook)'),
    violator: { path: 'src/components/ui/x.tsx', text: 'const m = useMutation({})' },
    nearMiss: { path: 'src/features/a/use-x.ts', text: 'const m = useMutation({})' },
  },
  {
    id: 'kebab-case-components',
    description: 'component files are kebab-case',
    detect: (f) => {
      if (!/^src\/(components|features\/[^/]+\/components)\/.+\.tsx?$/.test(f.path)) return []
      const name = posix.basename(f.path).replace(/(\.test)?\.tsx?$/, '')
      return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) ? [] : [`${f.path} is not kebab-case`]
    },
    violator: { path: 'src/components/ui/MyButton.tsx', text: '' },
    nearMiss: { path: 'src/components/ui/my-button.test.tsx', text: '' },
  },
  {
    id: 'no-event-source',
    description: 'no `new EventSource` (use lib/sse.ts)',
    detect: (f) => (isTest(f.path) ? [] : lines(f, /new\s+EventSource\b/, 'new EventSource (use lib/sse.ts)')),
    violator: { path: 'src/features/a/x.ts', text: "const s = new EventSource('/s')" },
    nearMiss: { path: 'src/features/a/x.ts', text: '// new EventSource is banned\nconst s = readStream()' },
  },
]

const raw = import.meta.glob<string>('/src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true })

const tree: Source[] = Object.entries(raw)
  .filter(([p]) => !p.endsWith('.d.ts') && !p.endsWith('routeTree.gen.ts'))
  .map(([p, text]) => ({ path: p.slice(1), text }))

describe('architecture gate', () => {
  it('scans the real tree', () => {
    expect(tree.length).toBeGreaterThan(20)
  })

  describe.each(RULES)('$id', (rule) => {
    it('flags its synthetic violator', () => {
      expect(rule.detect(rule.violator).length).toBeGreaterThan(0)
    })

    it('ignores its near-miss', () => {
      expect(rule.detect(rule.nearMiss)).toEqual([])
    })

    it(`holds on the tree: ${rule.description}`, () => {
      expect(tree.flatMap((f) => rule.detect(f))).toEqual([])
    })
  })
})
