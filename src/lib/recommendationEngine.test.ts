import { describe, expect, it } from "vitest";
import { generateRecommendation } from "./recommendationEngine";
import type { SkinAnalysisResult } from "./types";

function analysis(overrides: Partial<SkinAnalysisResult>): SkinAnalysisResult {
  return {
    redness: 80,
    hydration: 80,
    oiliness: 80,
    acne: 80,
    pores: 80,
    texture: 80,
    ageSpots: 80,
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

function recommend(a: SkinAnalysisResult) {
  return generateRecommendation({
    analysis: a,
    symptoms: [],
    sensitivities: [],
    recentActives: [],
  });
}

describe("generateRecommendation — acne + reduced hydration", () => {
  it("prioritizes acne-only ingredients when hydration is healthy", () => {
    const { prioritizedIngredients, avoidedIngredients } = recommend(
      analysis({ acne: 32, hydration: 80 }),
    );
    expect(prioritizedIngredients).toEqual(["Salicylic Acid", "Azelaic Acid", "Niacinamide"]);
    expect(avoidedIngredients).toContain("Heavy occlusives");
  });

  it("adds barrier-supporting ingredients when acne and hydration are both reduced", () => {
    // Matches the reported case: acne 32, hydration 48.
    const { prioritizedIngredients, avoidedIngredients, explanation } = recommend(
      analysis({ acne: 32, hydration: 48 }),
    );
    expect(prioritizedIngredients).toEqual(
      expect.arrayContaining([
        "Salicylic Acid",
        "Azelaic Acid",
        "Niacinamide",
        "Ceramides",
        "Panthenol",
      ]),
    );
    expect(explanation).toContain("barrier");
    // Occlusives support barrier repair — shouldn't be blanket-avoided here.
    expect(avoidedIngredients).not.toContain("Heavy occlusives");
  });
});
