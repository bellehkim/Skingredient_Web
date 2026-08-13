import type { SkinAnalysisResult } from "./types";
import { getMetricLabel } from "./metricStatus";

// Every SkinAnalysisResult field is already "higher = healthier" (see
// normalize() in src/routes/api/skin-analysis.ts) — including the concern
// metrics. So this is a plain weighted average with no inversion; applying
// 100 - score here would double-invert already-healthy-oriented data.
const WEIGHTS = {
  hydration: 0.2,
  redness: 0.2,
  oiliness: 0.15,
  acne: 0.15,
  texture: 0.1,
  pores: 0.1,
  ageSpots: 0.1,
} as const;

// Overall Condition describes today's state, not a skin type — so labels are
// health-state words (Excellent/Healthy/.../Compromised), not per-concern
// nouns like "Blemish-Prone" or "Oil-Prone" (those read as permanent traits,
// which belongs to deriveSkinType() instead, see src/lib/skinType.ts).
// Bands are purely score-based except one deliberate exception: notably high
// redness ("Needs Attention" tier, via the existing unchanged
// metricStatus.ts scale) always reads as "Reactive" regardless of overall
// score, since reactive/irritated skin is a distinct, actionable state worth
// calling out on its own.
const EXCELLENT_LOWER_BOUND = 85;
const HEALTHY_LOWER_BOUND = 70;
const BALANCED_LOWER_BOUND = 55;
const NEEDS_SUPPORT_LOWER_BOUND = 40;

function conditionLabel(score: number, redness: number): string {
  if (getMetricLabel(redness) === "Needs Attention") return "Reactive";
  if (score >= EXCELLENT_LOWER_BOUND) return "Excellent";
  if (score >= HEALTHY_LOWER_BOUND) return "Healthy";
  if (score >= BALANCED_LOWER_BOUND) return "Balanced";
  if (score >= NEEDS_SUPPORT_LOWER_BOUND) return "Needs Support";
  return "Compromised";
}

const METRIC_DISPLAY_NAME: Record<keyof typeof WEIGHTS, string> = {
  hydration: "hydration",
  redness: "redness",
  oiliness: "oiliness",
  acne: "acne",
  texture: "texture",
  pores: "pores",
  ageSpots: "dark spots",
};

export interface OverallConditionResult {
  score: number;
  label: string;
  description: string;
}

/**
 * Deterministic (no AI) — always the same output for the same analysis.
 *
 * Defensive against a partially-formed `analysis` (e.g. a field missing or
 * non-finite): those metrics are excluded and the remaining weights are
 * renormalized, rather than letting one bad field turn the whole score into
 * NaN via the weighted-sum reduce.
 */
export function deriveOverallCondition(analysis: SkinAnalysisResult): OverallConditionResult {
  const presentKeys = (Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>).filter((key) =>
    Number.isFinite(analysis[key]),
  );
  const totalWeight = presentKeys.reduce((sum, key) => sum + WEIGHTS[key], 0);

  const score = totalWeight
    ? Math.round(
        presentKeys.reduce((sum, key) => sum + (analysis[key] * WEIGHTS[key]) / totalWeight, 0),
      )
    : 0;

  const dominantConcern = presentKeys.reduce((worst, key) =>
    analysis[key] < analysis[worst] ? key : worst,
  );
  const label = conditionLabel(score, analysis.redness);
  const description = `Pay attention to ${METRIC_DISPLAY_NAME[dominantConcern]} and strengthen your barrier.`;

  return { score, label, description };
}
