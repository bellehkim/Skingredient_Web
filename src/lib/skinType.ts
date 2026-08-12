import type { SkinAnalysisResult } from "./types";

// Reuses the exact thresholds recommendationEngine.ts already treats as
// meaningful (hydration <= 45 = needs hydration support; redness <= 35 =
// barrier-recovery territory), and metricStatus.ts's tier boundary (39/69)
// for the oiliness band — no new "magic numbers" invented for this.
const OILY_UPPER_BOUND = 39;
const HIGH_OILINESS_LOWER_BOUND = 70;
const LOW_HYDRATION_THRESHOLD = 45;
const LOW_REDNESS_THRESHOLD = 35;

export type SkinBaseType = "Oily" | "Dry" | "Combination" | "Balanced";
export type SkinTypeModifier = "Dehydrated" | "Reactive";

export interface SkinTypeResult {
  baseType: SkinBaseType;
  modifiers: SkinTypeModifier[];
  label: string;
}

/**
 * Deterministic, non-AI classification of Skingredient's own skincare skin
 * type — distinct from YouCam's Fitzpatrick skin_type. Given the same
 * SkinAnalysisResult, always returns the same result.
 *
 * baseType uses only oiliness (primary) and hydration (to disambiguate
 * Dry/Combination/Balanced) — see the plan discussion for why acne/pores/
 * ageSpots/texture aren't used: none has a defensible causal link to
 * oily/dry/combination classification.
 *
 * modifiers are current-condition signals, computed independently of
 * baseType, so low hydration doesn't quietly turn someone's base type into
 * "Dry" — it adds a "Dehydrated" modifier instead. This split matters for
 * longitudinal tracking: baseType should stay stable scan-to-scan; modifiers
 * can move day to day.
 */
export function deriveSkinType(analysis: SkinAnalysisResult): SkinTypeResult {
  const { oiliness, hydration, redness } = analysis;
  const lowHydration = hydration <= LOW_HYDRATION_THRESHOLD;

  let baseType: SkinBaseType;
  if (oiliness <= OILY_UPPER_BOUND) {
    baseType = "Oily";
  } else if (oiliness >= HIGH_OILINESS_LOWER_BOUND) {
    baseType = lowHydration ? "Dry" : "Balanced";
  } else {
    // Moderate whole-face oiliness paired with low hydration is the classic
    // signature of an oily-T-zone/drier-cheeks split — SD tier gives no
    // per-region data, so this is an approximation, not a direct
    // regional measurement.
    baseType = lowHydration ? "Combination" : "Balanced";
  }

  const modifiers: SkinTypeModifier[] = [];
  if (lowHydration) modifiers.push("Dehydrated");
  if (redness <= LOW_REDNESS_THRESHOLD) modifiers.push("Reactive");

  const label = modifiers.length > 0 ? `${baseType} · ${modifiers.join(" · ")}` : baseType;

  return { baseType, modifiers, label };
}
