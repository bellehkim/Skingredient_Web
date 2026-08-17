// Demo Mode — a fixture/local-storage layer (src/data/demoFixture.ts,
// src/lib/data/localStore.ts) that never touches Anthropic, YouCam, or
// Supabase. Two independent ways to activate it, for two different
// purposes:
//
// 1. A dedicated "demo build" (VITE_DEMO_BUILD=true, see isDemoBuild below)
//    — permanently on, meant to be deployed and shared publicly so anyone
//    can try the app with zero API keys/Supabase project and zero cost to
//    us. Per-visitor state lives in that browser's localStorage only (see
//    localStore.ts) — never shared between visitors, never sent anywhere.
// 2. A DEV-only, session-scoped toggle (?demo=true, see setDemoModeActive
//    below) — a developer's own presentation aid on their real dev instance.
//    sessionStorage, not localStorage, so it clears itself the moment the
//    tab/browser session ends; a brand-new tab always starts in Real Mode.
//    Gated behind import.meta.env.DEV so a stray sessionStorage value or
//    query param can never activate this path in a production build.
const DEMO_MODE_KEY = "skingredient:demoMode";

// A dedicated "demo build" — VITE_DEMO_BUILD=true baked in at build time —
// is permanently in Demo Mode, no toggle needed. This is what makes a
// deployed demo link possible at all: import.meta.env.DEV is always false
// in any production build (dev-only server flag, compiled away), so without
// this a deployed build could never activate Demo Mode no matter what.
// Unlike the DEV-only ?demo=true toggle below (a developer's own presentation
// aid), this is meant to be shared publicly, so it's unconditional — never
// gated on DEV — and never touches sessionStorage.
const isDemoBuild = import.meta.env.VITE_DEMO_BUILD === "true";

export function isDemoModeActive(): boolean {
  if (isDemoBuild) return true;
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_MODE_KEY) === "true";
}

/**
 * True only for the DEV-only presentation toggle, never for a deployed demo
 * build. src/routes/insights.tsx and src/routes/history.$analysisId.tsx use
 * this (instead of isDemoModeActive()) specifically to decide whether to
 * show DEMO_ANALYSIS_HISTORY's fixed 5-day narrative (src/data/demoFixture.ts)
 * — a scripted trend line for a developer's live pitch, who hasn't actually
 * scanned 5 days in a row. A public demo build has no such script to show:
 * it should start genuinely empty (same as Reset) and grow from whatever the
 * visitor actually scans, which the normal getAnalysisHistory()/
 * getAnalysisById() (src/lib/data/analyses.ts) already provide — they read
 * from localStorage, not Supabase, whenever isDemoModeActive() is true.
 */
export function isScriptedPresentationDemo(): boolean {
  return import.meta.env.DEV && isDemoModeActive();
}

export function setDemoModeActive(active: boolean): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  if (active) {
    window.sessionStorage.setItem(DEMO_MODE_KEY, "true");
  } else {
    window.sessionStorage.removeItem(DEMO_MODE_KEY);
  }
}

/**
 * Snapshot of isDemoModeActive() taken once, at module evaluation — which
 * happens synchronously during the initial script load, before any
 * component has mounted or run an effect. src/lib/appStore.tsx uses this
 * (instead of the live isDemoModeActive()) to decide whether a
 * /welcome?demo=true visit is a *fresh* activation this page load: reading
 * the live value there would race against src/routes/welcome.tsx's own
 * effect, which may call setDemoModeActive(true) before or after
 * appStore's effect runs depending on React's mount-effect ordering between
 * ancestor and descendant components. This constant is immune to that —
 * it can only reflect what was true before either effect had a chance to
 * run.
 */
export const wasDemoModeActiveAtPageLoad: boolean = isDemoModeActive();
