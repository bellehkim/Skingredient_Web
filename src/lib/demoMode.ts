// Demo Mode — a presentation-only fixture layer (src/data/demoFixture.ts),
// never production behavior. Every read here is gated behind
// import.meta.env.DEV, so this can never activate in a production build even
// if a stray sessionStorage value or a ?demo=true query param ends up in a
// shared/bookmarked URL.
//
// Session-scoped on purpose: sessionStorage, not localStorage, so it clears
// itself the moment the tab/browser session ends. A brand-new tab always
// starts in Real Mode — Demo Mode must never be "sticky" across sessions,
// only across navigation and refreshes within the same tab (see
// src/routes/scan.index.tsx, which is the only place that turns this on).
const DEMO_MODE_KEY = "skingredient:demoMode";

export function isDemoModeActive(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DEMO_MODE_KEY) === "true";
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
