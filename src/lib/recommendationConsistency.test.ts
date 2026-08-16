/**
 * Integration coverage for the "single source of truth" consistency fix:
 * Today's Plan (generateRecommendation), Recommended Products
 * (getTodaysRecommendations), and AI Skin Strategy input
 * (buildSkinStrategyInput) must never disagree, because the latter two now
 * read only from the exact `recommendation` object the first produces —
 * never an independently-derived concern list. See the VERIFY cases in the
 * consistency-fix task this shipped under.
 */
import { describe, expect, it } from "vitest";
import { generateRecommendation } from "./recommendationEngine";
import { getTodaysRecommendations } from "./productRecommendations";
import { buildSkinStrategyInput, type SkinStrategyFlowParams } from "./skinStrategyFlow";
import type { CatalogProduct } from "./data/catalog";
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
    id: "analysis-1",
    ...overrides,
  };
}

function catalog(entries: [number, string, string, string][]): CatalogProduct[] {
  return entries.map(([id, category, inciName, functionalCategory]) => ({
    product_id: id,
    brand: "Brand",
    product_name: `${category} ${id}`,
    category,
    product_ingredients: [
      {
        ingredients: {
          inci_name: inciName,
          common_name: null,
          ingredient_functions: [{ functional_category: functionalCategory }],
        },
      },
    ],
  }));
}

function flowParams(): Omit<SkinStrategyFlowParams, "analysis"> {
  return {
    symptoms: [],
    scheduleTomorrow: "none",
    eventTiming: "none",
    ingredientHistory: {},
    irritatingCategories: new Set(),
    irritatingIngredientNames: [],
    shelfCategories: [],
  };
}

describe("Case A — healthy overall result", () => {
  it("gives a maintenance plan that Recommended Products and AI Skin Strategy both agree with (never inventing oiliness/pores)", () => {
    const a = analysis({ oiliness: 68, pores: 61 });
    const recommendation = generateRecommendation({
      analysis: a,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
    });
    expect(recommendation.direction).toBe("maintenance");
    expect(recommendation.prioritizedIngredients).toEqual(
      expect.arrayContaining(["Glycerin", "Ceramides"]),
    );

    const products = getTodaysRecommendations(
      catalog([
        [1, "Moisturizer", "Ceramide NP", "ceramide"],
        [2, "Sunscreen", "Titanium Dioxide", "uv_filter"],
      ]),
      recommendation,
    );
    // Recommended Products matches the maintenance plan's own categories —
    // not an independent "oiliness/pores are concerns" derivation.
    expect(products.map((p) => p.category)).toEqual(
      expect.arrayContaining(["Moisturizer", "Sunscreen"]),
    );

    const strategyInput = buildSkinStrategyInput({ analysis: a, ...flowParams() }, recommendation);
    // The AI never receives a separate "Oiliness, Pores" concern list —
    // only the exact same maintenance plan.
    expect(strategyInput.direction).toBe("Healthy Maintenance");
    expect(strategyInput.prioritizedIngredients).toEqual(recommendation.prioritizedIngredients);
    expect(strategyInput).not.toHaveProperty("concerns");
  });
});

describe("Case B — Blemish Control", () => {
  it("Today's Plan, Recommended Products, and AI Skin Strategy all reflect the same acne-related priorities", () => {
    const a = analysis({ acne: 32, hydration: 80 });
    const recommendation = generateRecommendation({
      analysis: a,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
    });
    expect(recommendation.direction).toBe("blemish-control");
    expect(recommendation.prioritizedIngredients).toEqual([
      "Salicylic Acid",
      "Azelaic Acid",
      "Niacinamide",
    ]);

    const products = getTodaysRecommendations(
      catalog([
        [1, "Treatment", "Salicylic Acid", "salicylic_acid"],
        [2, "Serum", "Niacinamide", "niacinamide"],
      ]),
      recommendation,
    );
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(p.reason).toContain("today's plan");
    }

    const strategyInput = buildSkinStrategyInput({ analysis: a, ...flowParams() }, recommendation);
    expect(strategyInput.direction).toBe("Blemish Control");
    expect(strategyInput.prioritizedIngredients).toEqual(recommendation.prioritizedIngredients);
  });
});

describe("Case C — Barrier Recovery", () => {
  it("products and AI strategy follow the same barrier-recovery priorities", () => {
    const a = analysis({ redness: 30, hydration: 40 });
    const recommendation = generateRecommendation({
      analysis: a,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
    });
    expect(recommendation.direction).toBe("barrier-recovery");

    const products = getTodaysRecommendations(
      catalog([[1, "Moisturizer", "Ceramide NP", "ceramide"]]),
      recommendation,
    );
    expect(products.map((p) => p.category)).toContain("Moisturizer");

    const strategyInput = buildSkinStrategyInput({ analysis: a, ...flowParams() }, recommendation);
    expect(strategyInput.direction).toBe("Barrier Recovery");
    expect(strategyInput.prioritizedIngredients).toEqual(recommendation.prioritizedIngredients);
  });
});

describe("Case D — Important Event schedule adjustment", () => {
  it("avoided ingredients from the schedule adjustment are respected by products and explained by AI strategy the same way", () => {
    const a = analysis({ acne: 32, hydration: 80 });
    const recommendation = generateRecommendation({
      analysis: a,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
      scheduleTomorrow: "important-event",
      eventTiming: "tomorrow",
    });
    expect(recommendation.avoidedIngredients).toContain("Salicylic Acid");
    // Conflict resolution must have already removed it from prioritized too.
    expect(recommendation.prioritizedIngredients).not.toContain("Salicylic Acid");

    const products = getTodaysRecommendations(
      catalog([[1, "Treatment", "Salicylic Acid", "salicylic_acid"]]),
      recommendation,
    );
    // Nothing prioritizes salicylic_acid anymore, so no product recommended for it.
    expect(products).toEqual([]);

    const strategyInput = buildSkinStrategyInput({ analysis: a, ...flowParams() }, recommendation);
    expect(strategyInput.avoidedIngredients).toEqual(recommendation.avoidedIngredients);
    expect(strategyInput.prioritizedIngredients).toEqual(recommendation.prioritizedIngredients);
  });
});
