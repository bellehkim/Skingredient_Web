import type { EventTiming, ScheduleOption, SkinAnalysisResult } from "@/lib/types";

// Demo Mode fixture (approved scenario: blemish/redness/texture concerns +
// an outdoor day tomorrow) — a presentation-only fixture layer, never
// production behavior. src/routes/scan.index.tsx's demo branch and
// src/routes/insights.tsx both read from this file instead of calling
// YouCam/Claude/Supabase when src/lib/demoMode.ts's session flag is active.
// Real mode never imports or touches this file's data.

/** Scores only — analyzedAt is stamped fresh at demo-scan time, same as a
 * real scan. Chosen to land solidly inside recommendationEngine.ts's
 * "Blemish Control" branch (acne <= 35) with its barrier-support add-on
 * (hydration <= 55), without crossing into "Barrier Recovery" (which would
 * need redness <= 35 too) or forcing the "Reactive" overall-condition
 * override (which needs redness <= 39). */
export const DEMO_ANALYSIS = {
  redness: 55,
  hydration: 50,
  oiliness: 60,
  acne: 28,
  pores: 60,
  texture: 58,
  ageSpots: 70,
};

/** Fixed "Today's Skin Direction" — deliberately skin-condition-only, never
 * mentions the outdoor-day scenario (that belongs to Skin Strategy below,
 * per the real skinDirectionService.ts prompt's own scope). */
export const DEMO_SKIN_DIRECTION =
  "Focus on gentle blemish control today while giving your skin some extra hydration support to keep your barrier comfortable.";

/** Fixed "Today's Skin Strategy" — written to match what the real
 * deterministic pipeline actually produces for DEMO_ANALYSIS +
 * DEMO_SCHEDULE_OPTION/DEMO_EVENT_TIMING (Blemish Control + Sunscreen added
 * by the outdoor-day adjustment), opening with the upcoming-plan
 * acknowledgment the way skinStrategyService.ts's real prompt would. */
export const DEMO_SKIN_STRATEGY =
  "With an outdoor day coming up tomorrow, today's plan puts extra focus on sun protection alongside your usual routine. A few breakouts and some redness are showing up together with slightly lower hydration, so the priority is gentle blemish control paired with steady barrier support rather than reaching for multiple strong treatments at once. Keep your routine simple and consistent today, and let your skin calm down before introducing anything new. Since tomorrow means more sun exposure, reapplying protection throughout the day matters just as much as your morning routine.";

/** Forced into generateRecommendation() only for the demo branch — never
 * written to daily_checkins, never affects real check-in state. Makes the
 * demo scenario reproducible regardless of what (if anything) was actually
 * checked in today. Everything else generateRecommendation() reads
 * (symptoms, ingredient sensitivities, product reactions) still comes from
 * real persisted app state, per the approved scope: only the upcoming-plan
 * context is fixed. */
export const DEMO_SCHEDULE_OPTION: ScheduleOption = "outdoor-day";
export const DEMO_EVENT_TIMING: EventTiming = "tomorrow";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Fixture history for Insights (Trend/History tabs) in Demo Mode only — read
 * directly in place of getAnalysisHistory() (src/lib/data/analyses.ts),
 * which is never called in Demo Mode and never touched by this file. Newest
 * first, matching getAnalysisHistory()'s real ordering. The newest entry
 * (index 0) is DEMO_ANALYSIS exactly, so today's demo scan and the top of
 * History/Trend always agree.
 *
 * All fields follow the app's "higher = healthier" convention throughout
 * (src/lib/overallCondition.ts), so "gradual improvement" means these
 * numbers trend upward over time. Acne climbs steadily from 18 to today's
 * 28 (still low enough to keep triggering Blemish Control today — the story
 * is "improving, not resolved yet"); hydration drifts up mildly. Every other
 * metric only wobbles a few points day to day around its "today" value —
 * plausible daily variation for the same person, not a second storyline.
 */
export const DEMO_ANALYSIS_HISTORY: SkinAnalysisResult[] = [
  { ...DEMO_ANALYSIS, analyzedAt: daysAgo(0) },
  {
    redness: 57,
    hydration: 49,
    oiliness: 62,
    acne: 26,
    pores: 60,
    texture: 56,
    ageSpots: 68,
    analyzedAt: daysAgo(1),
  },
  {
    redness: 54,
    hydration: 47,
    oiliness: 58,
    acne: 24,
    pores: 61,
    texture: 59,
    ageSpots: 69,
    analyzedAt: daysAgo(2),
  },
  {
    redness: 58,
    hydration: 45,
    oiliness: 61,
    acne: 21,
    pores: 59,
    texture: 55,
    ageSpots: 67,
    analyzedAt: daysAgo(3),
  },
  {
    redness: 53,
    hydration: 44,
    oiliness: 59,
    acne: 20,
    pores: 62,
    texture: 57,
    ageSpots: 68,
    analyzedAt: daysAgo(4),
  },
  {
    redness: 57,
    hydration: 42,
    oiliness: 63,
    acne: 18,
    pores: 58,
    texture: 54,
    ageSpots: 66,
    analyzedAt: daysAgo(5),
  },
];
