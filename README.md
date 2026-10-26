# Design OS

Personal workspace for a Product Designer at Lumin: **Overview · Lumin Work · Directory · Figma files · Storybook**.
Built from the Claude Design prototype in [`design/`](design/), which stays the UX/UI source of truth.

## Status

| Area | State |
|---|---|
| UI: shell, 5 views, drawers, dialogs, toast, mobile, dark mode | ✅ ported from `design/Design OS.dc.html` with `@luminpdf/ds` 0.2.11 |
| Business rules (`design/pdd-data.js`, `design/pdd-figma.js`) | ✅ ported to `src/rules/`, checked against the design files by `src/rules/parity.test.ts` |
| Login | ✅ single password, signed 30-day cookie |
| Linear | ✅ live via `GET /api/linear/workspace` once `LINEAR_API_KEY` is set (60 s cache) |
| Figma sync, page index, usage scan | ⏳ disconnected adapter (`src/data/figmaAdapter.ts`); nothing is fabricated |
| Storybook RSS/Atom feeds | ⏳ not fetched yet |
| Storage | ⏳ Storybook and Figma files are saved in the browser; Neon Postgres is next |

## Run locally

```bash
npm install
cp .env.example .env.local   # set APP_PASSWORD, SESSION_SECRET, LINEAR_API_KEY
npm run dev                  # app + /api on http://localhost:5173
npm test                     # rule parity tests
npm run build                # typecheck + production build → dist/
```

- **Sample mode:** set `VITE_SAMPLE_DATA=1` in `.env.local` to see the prototype's sample Linear and Figma data. It is for development only and skips login.
- **Preview build:** `npm run build:preview` writes one self-contained HTML file in sample mode to `dist-artifact/`, for sharing a preview.

## Deploy (Vercel)

1. Import this repo in Vercel. The framework is Vite; `vercel.json` sets the build.
2. Add the environment variables from `.env.example`. At minimum set `APP_PASSWORD`, `SESSION_SECRET` and `LINEAR_API_KEY`.
3. Each push to `main` deploys to production, and every other branch gets a preview URL.

## Layout

```
design/             Claude Design handoff (prototype, components, rules, HANDOFF.md). Replace on each handoff.
api/                Vercel functions (Web Request/Response): auth/*, linear/workspace
server/             server-only code: auth cookie, Linear GraphQL mapping
src/rules/          pdd.ts, figma.ts: rules with the same function names as design/*.js
src/data/           types, /api client, browser storage, Figma adapter, dev-only sample data
src/app/            store (state + actions, hash routes), Shell, Login
src/views/          Overview, Work, Directory, FigmaFiles, Storybook
src/overlays/       drawers, dialogs, toast
src/components/     Pill, IssueRow, IssueCard, ProjectCard, FigmaTile, ArticleCard, FileIndex, ds.ts
```

Inline styles are copied as CSS text from the design file through `sx()` in `src/lib/sx.ts`, so a new handoff can be diffed against the code.

## Changes from the prototype

These are visible changes. Please add them to the Claude Design file so the design and the code stay in sync.

- **No active cycle state** (Lumin Work cycle card and header, Overview date line): your Linear team has no running cycle.
- **Lumin Work banner copy** now depends on what is missing: Linear error, both integrations disconnected, or only Figma disconnected.
- **Login screen** (`src/app/Login.tsx`).
- **Integrations dialog:**
  - "Last synced" time and a Refresh button for Linear
  - "Sign out"
  - "To connect" text describing the Vercel environment variables
  - "Reset to starter library" only in development
- **Loading line** shown while the first Linear response arrives.
- **Directory:** a "Linear isn't available" line when Linear can't be loaded.
