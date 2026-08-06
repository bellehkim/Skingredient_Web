// Every skin metric in SkinAnalysisResult uses one convention: higher = healthier/
// better (matches YouCam's ui_score directly, see normalize() in
// src/routes/api/skin-analysis.ts). So a single scale applies to all of them —
// there's no per-metric direction to account for.
const NEEDS_ATTENTION_UPPER_BOUND = 39;
const MODERATE_UPPER_BOUND = 69;

export type MetricLabel = "Needs Attention" | "Moderate" | "Good";

export function getMetricLabel(value: number): MetricLabel {
  if (value <= NEEDS_ATTENTION_UPPER_BOUND) return "Needs Attention";
  if (value <= MODERATE_UPPER_BOUND) return "Moderate";
  return "Good";
}
