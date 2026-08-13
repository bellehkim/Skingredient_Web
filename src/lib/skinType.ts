import type { SkinAnalysisResult } from "./types";

// `oiliness` (like every SkinAnalysisResult field) is a health-oriented
// score where higher = healthier/better oil balance — it is NOT a literal
// "amount of oil on the skin" measurement. A high oiliness score means oil
// production is well-controlled (skin trends dry/normal); a low oiliness
// score means oil production is poorly controlled (skin trends oily). Don't
// read "oiliness >= 70" as "very oily" — it means the opposite.
const LOW_UPPER_BOUND = 39;
const HIGH_LOWER_BOUND = 70;

// Skin Type is the user's underlying type, not today's condition — that's
// Overall Condition's job (src/lib/overallCondition.ts). So this only ever
// returns one of these four values; it does not layer on
// current-condition words like "Dehydrated" or "Reactive".
export type SkinType = "Dry" | "Combination" | "Oily" | "Balanced";

/**
 * Deterministic, non-AI classification of Skingredient's own skincare skin
 * type — distinct from YouCam's Fitzpatrick skin_type. Given the same
 * SkinAnalysisResult, always returns the same result.
 *
 * Uses only oiliness (primary) and hydration (to disambiguate Dry/
 * Combination/Balanced) — acne/pores/ageSpots/texture/redness aren't used:
 * none has a defensible causal link to oily/dry/combination classification,
 * and redness in particular is a today-condition signal, not a type signal.
 *
 * Both Dry and Balanced require both metrics to genuinely clear a bound
 * (LOW/HIGH) rather than merely not-failing the other — "not low hydration"
 * alone isn't "healthy hydration", so mid-range (40-69) values on either
 * metric never qualify as Balanced; they fall through to Combination, the
 * catch-all for mixed/ambiguous patterns.
 */
export function deriveSkinType(analysis: SkinAnalysisResult): SkinType {
  const { oiliness, hydration } = analysis;

  if (oiliness <= LOW_UPPER_BOUND) return "Oily";
  if (hydration <= LOW_UPPER_BOUND && oiliness >= HIGH_LOWER_BOUND) return "Dry";
  if (hydration >= HIGH_LOWER_BOUND && oiliness >= HIGH_LOWER_BOUND) return "Balanced";
  return "Combination";
}
