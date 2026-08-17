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

Copy the example file and fill in your own keys:

```bash
cp .env.example .env
```

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
