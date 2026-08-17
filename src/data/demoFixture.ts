import { generateRecommendation } from "@/lib/recommendationEngine";
import type { EventTiming, ScheduleOption, SkinAnalysisResult } from "@/lib/types";

// Demo Mode fixture (approved scenario: blemish/redness/texture concerns +
// an outdoor day tomorrow) — a presentation-only fixture layer, never
// production behavior. src/routes/scan.index.tsx's demo branch,
// src/routes/insights.tsx, and src/routes/history.$analysisId.tsx all read
// from this file instead of calling YouCam/Claude/Supabase when
// src/lib/demoMode.ts's session flag is active. Real mode never imports or
// touches this file's data.

/** Scores only — analyzedAt is stamped fresh at demo-scan time, same as a
 * real scan. Chosen to land solidly inside recommendationEngine.ts's
 * "Blemish Control" branch (acne <= 35) with its barrier-support add-on
 * (hydration <= 55), without crossing into "Barrier Recovery" (which would
 * need redness <= 35 too) or forcing the "Reactive" overall-condition
 * override (which needs redness <= 39). Never change these — every other
 * demo-only day in DEMO_ANALYSIS_HISTORY is written to lead up to exactly
 * these values, not the other way around. */
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

/** Fixed "Today's Skin Strategy" — written to read comparably to a real
 * Claude-generated paragraph (src/lib/skinStrategyService.ts): today's skin
 * state first (breakouts/redness/hydration), then concrete actions
 * (familiar acne-focused ingredients, no stacking multiple strong actives,
 * keep the rest simple/hydrating), then the upcoming-plan preparation last
 * (avoid anything new tonight, broad-spectrum sunscreen + reapplication
 * once outdoors tomorrow) — matching what the real deterministic pipeline
 * actually produces for DEMO_ANALYSIS + DEMO_SCHEDULE_OPTION/
 * DEMO_EVENT_TIMING (Blemish Control priorities unchanged, Retinoids added
 * to avoided, Sunscreen deliberately NOT inserted into today's priorities —
 * see sunProtectionForTiming's "tomorrow" branch in scheduleAdjustments.ts). */
export const DEMO_SKIN_STRATEGY =
  "Your skin is showing active breakouts along with some redness and lower hydration today. Focus on gentle blemish care while keeping your skin barrier supported. Stick with your familiar acne-focused ingredients, avoid layering multiple strong actives, and keep the rest of your routine simple and hydrating. With outdoor activities planned for tomorrow, avoid introducing anything potentially irritating tonight and remember to use broad-spectrum sunscreen and reapply as needed while you're outdoors.";

/** Forced into generateRecommendation() only for the demo branch — never
 * written to daily_checkins, never affects real check-in state. Makes the
 * demo scenario reproducible regardless of what (if anything) was actually
 * checked in today. Everything else generateRecommendation() reads
 * (symptoms, ingredient sensitivities, product reactions) still comes from
 * real persisted app state, per the approved scope: only the upcoming-plan
 * context is fixed. */
export const DEMO_SCHEDULE_OPTION: ScheduleOption = "outdoor-day";
export const DEMO_EVENT_TIMING: EventTiming = "tomorrow";

/**
 * Catalog product ids behind each day's "Recommended for you" result, in
 * canonical skincare-step order (src/lib/productMatching.ts's
 * PRODUCT_STEP_ORDER): Cleanser, Toner/Essence, Serum, Moisturizer,
 * Treatment, Sunscreen. Indexed the same way as DEMO_ANALYSIS_HISTORY
 * (index 0 = today, index 4 = the oldest day) — a fixed, hand-curated
 * snapshot, not the output of re-running productRecommendations.ts, so
 * opening an old entry can never silently drift from what was "recommended"
 * that day.
 *
 * The baseline six (CeraVe Cleanser / Pyunkang Toner / Ordinary Niacinamide
 * Serum / iUNIK Moisturizer / Paula's Choice Treatment / EltaMD Sunscreen)
 * is reused on most days — the real engine stays in the same Blemish
 * Control + barrier-support branch for every day in this window (acne
 * 18-28, hydration 42-50 never cross a different threshold), so an
 * unchanging product mix on ordinary days is what the deterministic
 * pipeline would actually produce, not a shortcut. Only two days swap a
 * single product to reflect that day's standout concern:
 *  - the oldest day (worst breakouts, acne 18) swaps the Treatment slot for
 *    a stronger blemish-focused option (Effaclar Duo Benzoyl Peroxide,
 *    product 15) in place of the milder BHA liquid (16).
 *  - the hydration-dip day (hydration 42, its lowest point) swaps the Serum
 *    slot for a hydration-focused option (Ordinary Hyaluronic Acid 2% + B5,
 *    product 11) in place of the Niacinamide serum (10).
 * Every other slot, and every other day, stays identical — adjacent days
 * always share 5 of 6 products, so the story reads as "adapts when it
 * matters," not "reshuffles the whole routine daily."
 */
const HISTORY_PRODUCT_IDS: string[][] = [
  ["1", "17", "10", "5", "16", "7"], // today
  ["1", "17", "11", "5", "16", "7"], // yesterday — hydration dip, hydrating serum swapped in
  ["1", "17", "10", "5", "16", "7"], // 2 days ago
  ["1", "17", "10", "5", "16", "7"], // 3 days ago
  ["1", "17", "10", "5", "15", "7"], // 4 days ago — worst breakouts, stronger treatment swapped in
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** Stable, deterministic id for each DEMO_ANALYSIS_HISTORY entry —
 * "demo-YYYY-MM-DD" in local time, matching that entry's own analyzedAt day
 * exactly. The "demo-" prefix can never collide with a real Supabase
 * skin_analyses row (a uuid), so src/routes/history.$analysisId.tsx can
 * branch on it unambiguously. */
export function demoHistoryId(n: number): string {
  const d = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `demo-${year}-${month}-${day}`;
}

/** Looks up the recommended-product-id list for a given DEMO_ANALYSIS_HISTORY
 * entry by its id — a plain array index-out, never a recomputation. Returns
 * an empty list for an id that isn't a recognized demo history entry. */
export function getDemoHistoryProductIds(analysisId: string): string[] {
  const index = DEMO_ANALYSIS_HISTORY.findIndex((a) => a.id === analysisId);
  return index === -1 ? [] : HISTORY_PRODUCT_IDS[index];
}

type DemoScores = Omit<SkinAnalysisResult, "analyzedAt" | "id" | "recommendationSnapshot">;

/**
 * Builds one DEMO_ANALYSIS_HISTORY entry, computing recommendationSnapshot
 * via the real, unmodified generateRecommendation() exactly once here at
 * module load — never re-run when a history entry is later opened (see
 * history.$analysisId.tsx, which only ever reads this stored value). This
 * is the same "compute once at scan time, store as an immutable snapshot"
 * contract real analyses already follow (src/lib/data/analyses.ts), just
 * authored for a fixture instead of a live scan. Only today's entry (n=0)
 * gets the outdoor-day/tomorrow schedule context, matching the approved
 * demo scenario; the other days have no schedule, same as a real day with
 * nothing checked in.
 */
function buildHistoryEntry(n: number, scores: DemoScores, withSchedule: boolean): SkinAnalysisResult {
  const analyzedAt = daysAgo(n);
  const analysis: SkinAnalysisResult = { ...scores, analyzedAt };
  const recommendationSnapshot = generateRecommendation({
    analysis,
    symptoms: [],
    sensitivities: [],
    recentActives: [],
    ...(withSchedule
      ? { scheduleTomorrow: DEMO_SCHEDULE_OPTION, eventTiming: DEMO_EVENT_TIMING }
      : {}),
  });
  return { ...analysis, id: demoHistoryId(n), recommendationSnapshot };
}

/**
 * Fixture history for Insights (Trend/History tabs) and History detail in
 * Demo Mode only — read directly in place of getAnalysisHistory()/
 * getAnalysisById() (src/lib/data/analyses.ts), neither of which is ever
 * called in Demo Mode. Newest first, matching getAnalysisHistory()'s real
 * ordering. The newest entry (index 0) is DEMO_ANALYSIS exactly, so today's
 * demo scan and the top of History/Trend always agree.
 *
 * All fields follow the app's "higher = healthier" convention throughout
 * (src/lib/overallCondition.ts), so acne climbing from 18 (4 days ago, the
 * worst breakouts in this window) up to today's 28 means breakouts are
 * steadily improving, not worsening.
 *
 * The 5-day story (oldest to newest): breakouts start at their worst point
 * with hydration and redness both soft; redness dips further the next day
 * even as acne starts easing; skin stabilizes the day after; then hydration
 * takes its own temporary dip while breakouts keep improving; today,
 * breakouts/redness/hydration are all net-improved from the start of the
 * window even though the overall picture is still "Needs Support." Oiliness,
 * pores, texture and dark spots deliberately don't move in lockstep with
 * that story — they wobble a few points day to day (real short-term
 * variation) rather than forming a second, redundant trend line. Pores and
 * dark spots in particular are the most stable metrics day to day, matching
 * how slowly those actually change in reality. Overall Condition is never
 * set directly here — deriveOverallCondition() (src/lib/overallCondition.ts)
 * computes it from these seven fields the same way it does for a real scan,
 * and lands at approximately 48 -> 49 -> 50 -> 51 -> 53 across the window.
 */
export const DEMO_ANALYSIS_HISTORY: SkinAnalysisResult[] = [
  buildHistoryEntry(0, DEMO_ANALYSIS, true),
  buildHistoryEntry(
    1,
    { redness: 52, hydration: 42, oiliness: 64, acne: 25, pores: 60, texture: 58, ageSpots: 69 },
    false,
  ),
  buildHistoryEntry(
    2,
    { redness: 49, hydration: 46, oiliness: 61, acne: 23, pores: 59, texture: 57, ageSpots: 68 },
    false,
  ),
  buildHistoryEntry(
    3,
    { redness: 43, hydration: 45, oiliness: 63, acne: 20, pores: 59, texture: 58, ageSpots: 68 },
    false,
  ),
  buildHistoryEntry(
    4,
    { redness: 50, hydration: 44, oiliness: 58, acne: 18, pores: 57, texture: 55, ageSpots: 66 },
    false,
  ),
];
