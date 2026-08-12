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

const CONDITION_LABEL: Record<ReturnType<typeof getMetricLabel>, string> = {
  "Needs Attention": "Reactive",
  Moderate: "Uneven",
  Good: "Balanced",
};

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

  const label = CONDITION_LABEL[getMetricLabel(score)];

  const dominantConcern = presentKeys.reduce((worst, key) =>
    analysis[key] < analysis[worst] ? key : worst,
  );
  const description = `Pay attention to ${METRIC_DISPLAY_NAME[dominantConcern]} and strengthen your barrier.`;

  return { score, label, description };
}
