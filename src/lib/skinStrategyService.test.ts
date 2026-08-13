import { describe, expect, it } from "vitest";
import { buildPrompt, type SkinStrategyInput } from "./skinStrategyService";

function input(overrides: Partial<SkinStrategyInput> = {}): SkinStrategyInput {
  return {
    scores: {
      redness: 80,
      hydration: 80,
      oiliness: 80,
      acne: 80,
      pores: 80,
      texture: 80,
      ageSpots: 80,
    },
    overallCondition: { score: 75, label: "Healthy" },
    skinType: "Balanced",
    concerns: [],
    scheduleTomorrow: "none",
    shelfCategories: [],
    ...overrides,
  };
}

describe("buildPrompt", () => {
  it("reflects tomorrow's schedule selection", () => {
    const prompt = buildPrompt(input({ scheduleTomorrow: "important-event" }));
    expect(prompt).toContain("an important event tomorrow");
  });

  it("omits Shelf context when empty", () => {
    const prompt = buildPrompt(input({ shelfCategories: [] }));
    expect(prompt).not.toContain("already owns");
  });

  it("includes Shelf context only at the category level when present", () => {
    const prompt = buildPrompt(input({ shelfCategories: ["Cleanser", "Moisturizer"] }));
    expect(prompt).toContain("Cleanser, Moisturizer");
  });

  it("falls back to 'none' when there are no detected concerns", () => {
    const prompt = buildPrompt(input({ concerns: [] }));
    expect(prompt).toContain("none — skin is broadly balanced");
  });

  it("lists detected concerns when present", () => {
    const prompt = buildPrompt(input({ concerns: ["Redness", "Low Hydration"] }));
    expect(prompt).toContain("Redness, Low Hydration");
  });
});
