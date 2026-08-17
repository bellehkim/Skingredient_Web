# Skingredient

Skingredient is an AI-powered skincare companion that turns a face scan into a personalized, ingredient-level daily routine using the products you already own.

A skin scan (via Perfect Corp's YouCam API) scores redness, hydration, oiliness, acne, pores, texture, and age spots. Claude (Anthropic) turns those scores into a plain-language daily skin direction. From there, Skingredient matches your own shelf products against a curated ingredient library, tells you what to use, what's optional, and what to skip today, and composes an AM/PM routine around it.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React + file-based routing/SSR) and [Vite](https://vite.dev)
- TypeScript, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com) / Radix UI
- [Supabase](https://supabase.com) (Postgres + REST) for all persisted data
- [Anthropic Claude](https://www.anthropic.com) for the daily skin direction and skin strategy text
- [YouCam (Perfect Corp) Skin Analysis API](https://yce.makeupar.com/) for the actual face scan
- An [MCP](https://modelcontextprotocol.io) server (`src/lib/mcp/`) exposing ingredient search and the recommendation engine as tools

## Getting started

### Prerequisites

- Node.js 18+ (developed against Node 22)
- [Bun](https://bun.sh) (the project ships a committed `bun.lock`); `npm` also works if you prefer, it just won't use that lockfile

### 1. Install dependencies

```bash
bun install
# or: npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

That's it for just trying the app out — `.env.example` defaults to `VITE_DEMO_BUILD=true`, which runs the whole app with zero API keys and no Supabase project: every visitor's data lives only in their own browser's `localStorage` (`src/lib/data/localStore.ts`), and Anthropic/YouCam/Supabase are never called. See `src/lib/demoMode.ts` for how this works.

To run against the real stack instead (real scans, real AI-generated text, real persistence), set `VITE_DEMO_BUILD=false` and fill in:

| Variable | Required? | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key. Safe for client-side use; Row Level Security controls access. |
| `ANTHROPIC_API_KEY` | Yes | Powers the daily skin direction / skin strategy generation. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). Server-side only, never exposed to the client. |
| `YOUCAM_API_KEY` | Only for real scans | Needed if `VITE_ENABLE_REAL_SCAN=true`. Get one at the [YouCam API console](https://yce.makeupar.com/api-console/en/api-keys/). Server-side only. |
| `VITE_ENABLE_REAL_SCAN` | No (defaults to `false`) | With `false`, scans use mock analysis data (`src/lib/skinAnalysisService.ts`), so you can run the whole app without a YouCam key. Set to `true` to call the real API. |

You'll also need a Supabase project with the schema this app expects; see `supabase/migrations/` for the schema and seed data.

### 3. Run the dev server

```bash
bun run dev
# or: npm run dev
```

Opens at `http://localhost:8080` (Vite will pick the next free port, e.g. `8081`, if that's taken).

## Demo Mode vs Real Mode

The app has two completely separate ways to run, controlled by one flag: `VITE_DEMO_BUILD` in `.env`.

### Demo Mode (`VITE_DEMO_BUILD=true` — the default)

- No API keys or Supabase project needed. Anthropic, YouCam, and Supabase are never called — every scan, shelf item, reaction, check-in, and routine entry is generated from local fixtures or read/written straight to your browser's `localStorage` (`src/lib/data/localStore.ts`).
- **Data is per-browser, not shared.** Two people (or two browsers on the same computer) visiting the same demo deployment each get their own isolated data — nothing is sent to a server, so nobody can see anyone else's.
- **Data persists across visits on the same browser.** Close the tab, come back tomorrow — your shelf/scans/reactions are still there, because they live in that browser's `localStorage`, not a session that expires.
- A brand-new browser (or a browser that's never visited before) starts completely empty — same state as pressing Reset.
- **Resetting to a fresh state**: click the "Reset demo" button (bottom-right on the Profile page). It just clears the app's `localStorage` keys and reloads to `/welcome`. You can also do this manually, with the same effect:
  - Open the site in a private/incognito window (wiped when that window closes)
  - Open it in a different browser or device (localStorage never crosses browsers)
  - DevTools → Application tab → Local Storage → delete the `skingredient:demo:*` keys, or just run `localStorage.clear()` in the console
- Meant to be safely shared/deployed publicly — see `src/lib/demoMode.ts` for exactly what this does and doesn't call.

### Real Mode (`VITE_DEMO_BUILD=false`)

- Uses your actual Supabase project, Anthropic, and (if `VITE_ENABLE_REAL_SCAN=true`) YouCam — see the environment variable table above for what's required.
- All data is shared across every visitor by design (single hardcoded demo user, `src/lib/data/demoUser.ts` — there's no real auth yet), so this mode is for your own development/testing, not for handing a link to other people.
- The same "Reset demo" button still appears when running locally (`npm run dev`), but here it calls `resetDemoUser()` instead — it deletes and recreates the Supabase demo user, which cascades to clear every table scoped to it (scans, shelf, custom products, reactions, etc.) while leaving the shared product/ingredient catalog untouched.

### Switching between them

Change `VITE_DEMO_BUILD` in `.env` and restart the dev server (`bun run dev`) — there's no in-app toggle for this flag, since it's baked in at build/start time, not read at runtime. For a deployed app, this means Demo Mode and Real Mode have to be two separate deployments (two different sets of environment variables), not one URL that switches.

There's also a second, unrelated toggle — `/scan?demo=true` — which only works in local `npm run dev` (never in a built/deployed app) and is just a developer's own presentation aid: it shows a fixed 5-day trend fixture without needing you to have actually scanned for 5 days. It's independent of `VITE_DEMO_BUILD` and not meant to be shared with anyone.

## Available scripts

| Command | Description |
| --- | --- |
| `dev` | Start the Vite dev server |
| `build` | Production build |
| `build:dev` | Development-mode build |
| `preview` | Preview a production build locally |
| `lint` | Run ESLint |
| `format` | Run Prettier (writes changes) |
| `test` | Run the Vitest suite |

## Notes

- Product photos: real product photos are stored locally under `public/product-images/` and referenced by `src/data/productImages.ts`. If that folder isn't present, product cards gracefully fall back to a placeholder icon.
- `AGENTS.md` and the `<!-- LOVABLE:BEGIN -->` block exist because this project was originally scaffolded and is synced with [Lovable](https://lovable.dev); they don't affect running the app.
