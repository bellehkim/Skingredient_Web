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
    eventTiming: "none",
    shelfCategories: [],
    ...overrides,
  };
}

describe("buildPrompt", () => {
  it("reflects both event type and timing", () => {
    const prompt = buildPrompt(
      input({ scheduleTomorrow: "important-event", eventTiming: "tomorrow" }),
    );
    expect(prompt).toContain("an important event tomorrow");
  });

  it("reflects a non-tomorrow timing", () => {
    const prompt = buildPrompt(input({ scheduleTomorrow: "travel", eventTiming: "three-days" }));
    expect(prompt).toContain("travel within the next few days");
  });

  it("treats type 'none' as no upcoming plan even if timing were set", () => {
    const prompt = buildPrompt(input({ scheduleTomorrow: "none", eventTiming: "none" }));
    expect(prompt).toContain("nothing special planned");
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
