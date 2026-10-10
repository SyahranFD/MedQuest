# MedQuest frontend (demo)

Voice-ready patient simulation for Indonesian medical students (koas), built for the 12th CLOSER 2026
competition. This package is the **frontend-only demo**: no backend, no accounts, no AI or API keys, and no
network calls at runtime. Cases, the scripted patient dialogue, the deterministic grader and a fictional
lecturer class are bundled; finished sessions are kept in `localStorage`.

Stack: Vite 8, React 19 (StrictMode), TypeScript strict, TanStack Router (file based, auto code splitting) and
Query, Zustand, Tailwind v4, Radix primitives, motion, sonner, zod 4, three.js with react-three-fiber for the
clinic scene and the clay landing art.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b, then vite build into dist/
npm run preview      # serve the production build
```

No environment variables are needed (see `.env.example`). The demo works offline.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (port 5173; pass `-- --port N --strictPort` to change) |
| `npm run routes` | Regenerate `src/routeTree.gen.ts` from `src/routes` |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | `oxlint --deny-warnings` |
| `npm test` | Vitest (unit, component and architecture tests) |
| `npm run gate` | routes, typecheck, lint, tests, `vite build`. Must be green before any hand-off |
| `npm run test:e2e` | Playwright against the installed Chrome (`channel: 'chrome'`), one worker, dedicated dev server on port 5174. Not part of `gate` |

E2E specs live in `e2e/`: landing and static pages, poli flow to debrief, ER shift, lecturer dashboard, axe
accessibility sweeps for every route and key states (dialogs, tabs, debrief), and quality checks (reflow at
320, 390 and 720 px, touch targets, keyboard traversal, live regions, reduced motion, high contrast, offline).
Chrome is launched with `--use-angle=swiftshader` so WebGL works on machines without a GPU.

## Routes

| Route | Surface |
|---|---|
| `/` | Landing (clay hero, how it works, product mockup loop, institutions, FAQ) |
| `/syarat`, `/privasi` | Terms and privacy |
| `/app` | Student home: modes, resume, recent results, progress |
| `/app/kasus`, `/app/kasus/$caseId` | Case library with filters and the case brief |
| `/app/sesi/$sessionId` | Encounter: 3D clinic, anamnesis, exam, orders, diagnosis, treatment (poli and ER) |
| `/app/debrief/$sessionId` | Score per dimension, decision timeline, guideline citations, empathy |
| `/app/riwayat` | Personal history and statistics |
| `/dosen`, `/dosen/mahasiswa`, `/dosen/mahasiswa/$studentId`, `/dosen/perpustakaan` | Lecturer dashboard, student list and detail, case catalogue |
| `/lab/*` | Component and 3D labs for development (`/lab/ui` and `/lab/shell` return 404 in production builds) |

## Structure

```
src/
  routes/        file routes, composition only
  features/      cases, dialogue, grading, session (training domain, shared); clinic-3d, landing-3d
                 (shared 3D toolkits); landing, simulator, dashboard, library, history (app features)
  components/    ui primitives, shell, page, charts (domain blind)
  lib/           i18n (id default, en), motion, emotion and scene contracts, utils
  stores/        persisted UI preferences (theme, locale, quality, reduced motion)
e2e/             Playwright specs
```

Dependency direction is `routes -> features -> components + lib + stores`, enforced by
`src/architecture.test.ts` (also bans hex colors outside tokens, `fetch(` outside `lib/api.ts`, cross-feature
imports and other rules from `CLAUDE.md`).

## Demo data

- **Cases**: six synthetic cases (STEMI, dengue with shock, severe malaria, TB, hypertension, diabetes) in
  `src/features/cases/data`. No real patient data anywhere.
- **Dialogue**: keyword matching over a scripted catalogue (`features/dialogue`). Empathic, interrupting or
  dismissive wording moves the patient trust meter and mood.
- **Grader**: deterministic rubric (`features/grading`). Citations come only from the fixed guideline registry
  (PERKI, PERDOSSI, Kemenkes, plus a few international guidelines); a citation outside the registry is a bug.
- **Lecturer class**: 36 fictional students generated from a seeded PRNG (`features/dashboard/mock-class.ts`),
  so numbers are stable between reloads. Demo history for the student is seeded on first run.
- **Reset**: Settings, "Reset data demo" clears sessions and onboarding. UI preferences stay.

## Future backend: the repository seams

Every data access goes through an async repository function, so a backend can replace the bundled data without
touching screens:

| Seam | Functions |
|---|---|
| `features/cases/repository.ts` | `listCases`, `getCase` (sync `requireCase` is used by pure engines) |
| `features/session/repository.ts` | `listSessionResults`, `getSessionResult`, `saveSessionResult`, `clearSessionResults` (zod validated rows) |
| `features/dashboard/repository.ts` | `listStudents`, `getStudent`, `getClassOverview`, `getCaseStats`, `getMostMissedCriteria`, `getWeeklyTrend` |

Screens call these through TanStack Query (query keys live in each feature's `keys.ts`). To go live: implement
the same signatures on top of `lib/api.ts` (the only module allowed to call `fetch`), generate DTO types from the
backend OpenAPI, and keep the field names exactly as the backend sends them. The scripted dialogue and
deterministic grader are the pieces the voice worker and LLM grader will replace; their inputs and outputs are
already plain data (`Session`, `Evaluation`). All provider keys stay server side; the browser only ever sees
`VITE_*` public values.

## Accessibility and quality

Skip link, one `h1` and one `main` per page, visible focus, 44 px touch targets on coarse pointers, polite live
regions for trust changes and toasts, focus returns to the opener when a dialog closes, and support for
`prefers-reduced-motion`, `prefers-reduced-transparency` and `prefers-contrast`. The e2e suite runs axe on every
route in Indonesian and English.

## CI/CD and deploy

- `gate` (`.github/workflows/gate.yml`) runs `npm run gate` and checks `src/routeTree.gen.ts` is not stale, on every
  pull request and push to `main`.
- `deploy` (`.github/workflows/deploy.yml`) builds and rsyncs `dist/` to the VPS. Pushing to `main` deploys nothing:
  push a tag (`git tag v0.1.0 && git push origin v0.1.0`) or run the workflow by hand with a tag or branch. Rolling
  back is deploying an older tag.
- Live at https://medquest.syahranfd.site: static files in `/var/www/medquest`, served by Nginx with a SPA fallback and
  a Let's Encrypt certificate (certbot renews it).
- The deploy key can only rsync into that one folder (`rrsync` forced command in the `deploy` user's
  `authorized_keys`). Repo secrets: `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` (pinned host key), `VPS_HOST`, `VPS_USER`. No
  AI or provider key is involved; the demo is frontend-only.

## Known limits

- Frontend-only: no auth, no voice (STT or TTS), no real AI, no persistence beyond the browser.
- Dialogue is keyword based, so phrasing outside the catalogue gets a generic reply.
- Lecturer data is fictional and read only; "assign case" is stored locally.
- The 3D scene needs WebGL; without it a static SVG fallback is shown. `Quality` can be set to "Hemat" in Settings.
- Cases are synthetic and not yet validated by a medical consultant. MedQuest is training software, not a clinical
  decision tool.
