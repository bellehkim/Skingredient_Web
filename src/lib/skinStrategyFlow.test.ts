import { describe, expect, it } from "vitest";
import { buildSkinStrategyInput, type SkinStrategyFlowParams } from "./skinStrategyFlow";
import type { DailyRecommendation, SkinAnalysisResult } from "./types";

function analysis(overrides: Partial<SkinAnalysisResult> = {}): SkinAnalysisResult {
  return {
    redness: 60,
    hydration: 60,
    oiliness: 60,
    acne: 60,
    pores: 60,
    texture: 60,
    ageSpots: 60,
    analyzedAt: new Date().toISOString(),
    id: "analysis-1",
    ...overrides,
  };
}

function params(overrides: Partial<SkinStrategyFlowParams> = {}): SkinStrategyFlowParams {
  return {
    analysis: analysis(),
    symptoms: [],
    scheduleTomorrow: "none",
    eventTiming: "none",
    ingredientHistory: {},
    irritatingCategories: new Set(),
    irritatingIngredientNames: [],
    shelfCategories: [],
    ...overrides,
  };
}

function recommendation(overrides: Partial<DailyRecommendation> = {}): DailyRecommendation {
  return {
    direction: "hydration-support",
    displayName: "Hydration Support",
    explanation: "Your skin needs a hydration boost today.",
    prioritizedIngredients: [],
    avoidedIngredients: [],
    riskLevel: "low",
    ...overrides,
  };
}

describe("buildSkinStrategyInput", () => {
  it("carries the exact analysis scores through", () => {
    const input = buildSkinStrategyInput(
      params({ analysis: analysis({ redness: 20 }) }),
      recommendation(),
    );
    expect(input.scores.redness).toBe(20);
  });

  it("passes irritatingIngredientNames through as irritatingIngredients", () => {
    const input = buildSkinStrategyInput(
      params({ irritatingIngredientNames: ["Retinol"] }),
      recommendation(),
    );
    expect(input.irritatingIngredients).toEqual(["Retinol"]);
  });

  it("passes shelfCategories and schedule context through unchanged", () => {
    const input = buildSkinStrategyInput(
      params({ shelfCategories: ["Cleanser"], scheduleTomorrow: "travel", eventTiming: "week" }),
      recommendation(),
    );
    expect(input.shelfCategories).toEqual(["Cleanser"]);
    expect(input.scheduleTomorrow).toBe("travel");
    expect(input.eventTiming).toBe("week");
  });

  it("sources direction/explanation/prioritize/avoid/risk from the given recommendation, never independently derived", () => {
    const input = buildSkinStrategyInput(
      params(),
      recommendation({
        displayName: "Blemish Control",
        explanation: "Focus on gentle blemish control.",
        prioritizedIngredients: ["Niacinamide", "Salicylic Acid"],
        avoidedIngredients: ["Retinoids", "AHA"],
        riskLevel: "moderate",
      }),
    );
    expect(input.direction).toBe("Blemish Control");
    expect(input.explanation).toBe("Focus on gentle blemish control.");
    expect(input.prioritizedIngredients).toEqual(["Niacinamide", "Salicylic Acid"]);
    expect(input.avoidedIngredients).toEqual(["Retinoids", "AHA"]);
    expect(input.riskLevel).toBe("moderate");
  });
});
