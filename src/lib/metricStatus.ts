// Every skin metric in SkinAnalysisResult uses one convention: higher = healthier/
// better (matches YouCam's ui_score directly, see normalize() in
// src/routes/api/skin-analysis.ts). So a single scale applies to all of them —
// there's no per-metric direction to account for.
const NEEDS_ATTENTION_UPPER_BOUND = 39;
const MODERATE_UPPER_BOUND = 69;

export type MetricLabel = "Needs Attention" | "Moderate" | "Good";

/**
 * Coarse 3-tier bucket used for cross-metric logic (deriveOverallCondition's
 * "Reactive" override, deriveSkinConcerns' concern filter) — NOT for display
 * text. For the per-metric word shown on MetricBar, see getMetricStatusText
 * below; the two scales are intentionally separate and don't need to agree.
 */
export function getMetricLabel(value: number): MetricLabel {
  if (value <= NEEDS_ATTENTION_UPPER_BOUND) return "Needs Attention";
  if (value <= MODERATE_UPPER_BOUND) return "Moderate";
  return "Good";
}

export type MetricField =
  | "redness"
  | "hydration"
  | "oiliness"
  | "acne"
  | "pores"
  | "texture"
  | "ageSpots";

// Per-metric display word for each score band, so "Good" doesn't repeat
// identically across every metric on the Results page. Bands: 90-100, 80-89,
// 70-79, 60-69, 0-59 — entries ordered highest-first so the first band whose
// floor the score meets or exceeds wins.
const METRIC_STATUS_BANDS: Record<MetricField, ReadonlyArray<readonly [number, string]>> = {
  redness: [
    [90, "Minimal"],
    [80, "Low"],
    [70, "Mild"],
    [60, "Moderate"],
    [0, "High"],
  ],
  hydration: [
    [90, "Deeply Hydrated"],
    [80, "Hydrated"],
    [70, "Adequate"],
    [60, "Low"],
    [0, "Dehydrated"],
  ],
  oiliness: [
    [90, "Balanced"],
    [80, "Balanced"],
    [70, "Mostly Balanced"],
    [60, "Slightly Oily"],
    [0, "Oily"],
  ],
  acne: [
    [90, "Clear"],
    [80, "Mostly Clear"],
    [70, "Mild"],
    [60, "Moderate"],
    [0, "Breakout-Prone"],
  ],
  pores: [
    [90, "Refined"],
    [80, "Fine"],
    [70, "Visible"],
    [60, "Noticeable"],
    [0, "Prominent"],
  ],
  texture: [
    [90, "Smooth"],
    [80, "Smooth"],
    [70, "Fairly Smooth"],
    [60, "Uneven"],
    [0, "Rough"],
  ],
  ageSpots: [
    [90, "Even"],
    [80, "Minimal"],
    [70, "Mild"],
    [60, "Noticeable"],
    [0, "Prominent"],
  ],
};

/** Per-metric display word for the given score (e.g. redness 92 -> "Minimal",
 * hydration 45 -> "Dehydrated") — what MetricBar shows on Results/History/Insights. */
export function getMetricStatusText(field: MetricField, value: number): string {
  const bands = METRIC_STATUS_BANDS[field];
  for (const [floor, text] of bands) {
    if (value >= floor) return text;
  }
  return bands.at(-1)![1];
}
