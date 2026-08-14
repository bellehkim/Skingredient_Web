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
  eventTiming?: RecommendationInput["eventTiming"],
) {
  return generateRecommendation({
    analysis: a,
    symptoms: [],
    sensitivities: [],
    recentActives: [],
    scheduleTomorrow,
    eventTiming,
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

describe("generateRecommendation — upcoming plan (type + timing)", () => {
  it("modifies (not replaces) the skin-analysis baseline for an important event tomorrow", () => {
    const { prioritizedIngredients, avoidedIngredients } = recommend(
      analysis({ acne: 32, hydration: 80 }),
      "important-event",
      "tomorrow",
    );
    expect(prioritizedIngredients).toEqual(["Niacinamide", "Ceramides", "Panthenol"]);
    expect(avoidedIngredients).toEqual(expect.arrayContaining(["Salicylic Acid", "Azelaic Acid"]));
  });

  it("applies a lighter, moderate adjustment for an important event within 3 days", () => {
    const { prioritizedIngredients } = recommend(
      analysis({ acne: 32, hydration: 80 }),
      "important-event",
      "three-days",
    );
    expect(prioritizedIngredients).toEqual(["Niacinamide"]);
    expect(prioritizedIngredients).not.toContain("Ceramides");
  });

  it("leaves ingredients untouched (informational only) for an important event within a week", () => {
    const baseline = recommend(analysis({ acne: 32, hydration: 80 }));
    const { prioritizedIngredients, avoidedIngredients } = recommend(
      analysis({ acne: 32, hydration: 80 }),
      "important-event",
      "week",
    );
    expect(prioritizedIngredients).toEqual(baseline.prioritizedIngredients);
    expect(avoidedIngredients).toEqual(baseline.avoidedIngredients);
  });

  it("an event type without a timing ('none') leaves the baseline unchanged", () => {
    const baseline = recommend(analysis({ acne: 32, hydration: 80 }));
    const withEvent = recommend(analysis({ acne: 32, hydration: 80 }), "important-event", "none");
    expect(withEvent).toEqual(baseline);
  });

  it("is skipped entirely on a high-risk (pause-actives) day — already maximally gentle", () => {
    const withEvent = generateRecommendation({
      analysis: analysis({}),
      symptoms: ["burning"],
      sensitivities: [],
      recentActives: [],
      scheduleTomorrow: "important-event",
      eventTiming: "tomorrow",
    });
    expect(withEvent.riskLevel).toBe("high");
    expect(withEvent.explanation).not.toContain("important event");
  });

  it("'none' schedule context leaves the baseline completely unchanged", () => {
    const baseline = recommend(analysis({ acne: 32, hydration: 80 }));
    const withNone = recommend(analysis({ acne: 32, hydration: 80 }), "none", "tomorrow");
    expect(withNone).toEqual(baseline);
  });
});

describe("generateRecommendation — reported ingredient reactions", () => {
  it("moves a prioritized label to avoided when its functional_category was reported irritating", () => {
    // Barrier-recovery day prioritizes Ceramides — reporting the exact
    // ingredient "Ceramide NP" (which maps to the "ceramide" category, not
    // the string "Ceramides") as irritating should still catch it via the
    // category bridge, not a direct string comparison.
    const { prioritizedIngredients, avoidedIngredients } = generateRecommendation({
      analysis: analysis({ redness: 30, hydration: 40 }),
      symptoms: [],
      sensitivities: [],
      recentActives: [],
      irritatingCategories: new Set(["ceramide"]),
    });
    expect(prioritizedIngredients).not.toContain("Ceramides");
    expect(avoidedIngredients).toContain("Ceramides");
  });

  it("leaves prioritized ingredients untouched when no reported reaction matches their category", () => {
    const withoutReaction = recommend(analysis({ redness: 30, hydration: 40 }));
    const withUnrelatedReaction = generateRecommendation({
      analysis: analysis({ redness: 30, hydration: 40 }),
      symptoms: [],
      sensitivities: [],
      recentActives: [],
      irritatingCategories: new Set(["retinoid"]),
    });
    expect(withUnrelatedReaction.prioritizedIngredients).toEqual(
      withoutReaction.prioritizedIngredients,
    );
  });
});
