import { describe, expect, it } from "vitest";
import { generateRecommendation } from "./recommendationEngine";
import type { RecommendationInput, SkinAnalysisResult } from "./types";

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

function recommend(
  a: SkinAnalysisResult,
  scheduleTomorrow?: RecommendationInput["scheduleTomorrow"],
) {
  return generateRecommendation({
    analysis: a,
    symptoms: [],
    sensitivities: [],
    recentActives: [],
    scheduleTomorrow,
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

describe("generateRecommendation — tomorrow's schedule context", () => {
  it("modifies (not replaces) the skin-analysis baseline for an important event", () => {
    const { prioritizedIngredients, avoidedIngredients } = recommend(
      analysis({ acne: 32, hydration: 80 }),
      "important-event",
    );
    expect(prioritizedIngredients).toEqual(["Niacinamide", "Ceramides", "Panthenol"]);
    expect(avoidedIngredients).toEqual(expect.arrayContaining(["Salicylic Acid", "Azelaic Acid"]));
  });

  it("is skipped entirely on a high-risk (pause-actives) day — already maximally gentle", () => {
    const withEvent = generateRecommendation({
      analysis: analysis({}),
      symptoms: ["burning"],
      sensitivities: [],
      recentActives: [],
      scheduleTomorrow: "important-event",
    });
    expect(withEvent.riskLevel).toBe("high");
    expect(withEvent.explanation).not.toContain("important event");
  });

  it("'none' schedule context leaves the baseline completely unchanged", () => {
    const baseline = recommend(analysis({ acne: 32, hydration: 80 }));
    const withNone = recommend(analysis({ acne: 32, hydration: 80 }), "none");
    expect(withNone).toEqual(baseline);
  });
});
