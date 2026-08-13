import type { SkinAnalysisResult } from "./types";
import { getMetricLabel } from "./metricStatus";

// Skin concern → ingredient_functions.functional_category codes, per
// Skingredient_MVP_Implementation_Guide.md Section 6. Codes verified against
// what's actually seeded (supabase/migrations/20260812010000_product_catalog.sql)
// — "Urea" and "Tranexamic Acid" have no seeded category, so they're omitted
// rather than inventing rows for them. One flat config, easy to extend later.
export const CONCERN_INGREDIENT_CATEGORIES: Record<string, string[]> = {
  Redness: ["centella", "panthenol", "ceramide"],
  "Low Hydration": ["hyaluronic_acid", "glycerin", "ceramide"],
  Acne: ["salicylic_acid", "benzoyl_peroxide", "niacinamide"],
  Oiliness: ["niacinamide", "zinc_pca", "salicylic_acid"],
  "Dark Spots": ["vitamin_c", "azelaic_acid"],
  Texture: ["retinoid", "glycolic_acid", "pha"],
  Pores: ["niacinamide", "salicylic_acid", "retinoid"],
};

// Short phrase per concern for the recommendation card's reason sentence.
const CONCERN_PHRASES: Record<string, string> = {
  Redness: "increased redness",
  "Low Hydration": "reduced hydration",
  Acne: "breakouts",
  Oiliness: "excess oiliness",
  "Dark Spots": "visible dark spots",
  Texture: "uneven texture",
  Pores: "enlarged pores",
};

export function concernPhrase(concern: string): string {
  return CONCERN_PHRASES[concern] ?? concern.toLowerCase();
}

const CONCERN_FIELDS: { concern: string; field: keyof SkinAnalysisResult }[] = [
  { concern: "Redness", field: "redness" },
  { concern: "Low Hydration", field: "hydration" },
  { concern: "Acne", field: "acne" },
  { concern: "Oiliness", field: "oiliness" },
  { concern: "Dark Spots", field: "ageSpots" },
  { concern: "Texture", field: "texture" },
  { concern: "Pores", field: "pores" },
];

/** All fields use "higher = healthier" (see normalize() in
 * src/routes/api/skin-analysis.ts) — a concern is present when a field's
 * existing getMetricLabel() isn't "Good", reusing the same 3-tier scale
 * MetricBar already renders, instead of a second threshold definition. */
export function deriveSkinConcerns(analysis: SkinAnalysisResult): string[] {
  return CONCERN_FIELDS.filter(
    ({ field }) => getMetricLabel(analysis[field] as number) !== "Good",
  ).map(({ concern }) => concern);
}
