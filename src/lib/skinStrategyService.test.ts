import { describe, expect, it } from "vitest";
import {
  buildPrompt,
  sanitizeSkinStrategyText,
  type SkinStrategyInput,
} from "./skinStrategyService";

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
    direction: "Healthy Maintenance",
    explanation: "Your skin looks healthy today.",
    prioritizedIngredients: [],
    avoidedIngredients: [],
    riskLevel: "low",
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

  it("falls back to placeholder text when nothing is prioritized/avoided", () => {
    const prompt = buildPrompt(input({ prioritizedIngredients: [], avoidedIngredients: [] }));
    expect(prompt).toContain("Prioritize: nothing specific today.");
    expect(prompt).toContain("Avoid: nothing specific today.");
  });

  it("reflects the exact same plan Today's Plan shows — direction, prioritize, and avoid", () => {
    const prompt = buildPrompt(
      input({
        direction: "Blemish Control",
        prioritizedIngredients: ["Niacinamide", "Salicylic Acid"],
        avoidedIngredients: ["Retinoids", "AHA"],
      }),
    );
    expect(prompt).toContain("Direction: Blemish Control");
    expect(prompt).toContain("Prioritize: Niacinamide, Salicylic Acid");
    expect(prompt).toContain("Avoid: Retinoids, AHA");
  });
});

describe("sanitizeSkinStrategyText", () => {
  it("never leaves an em dash or en dash in the final text", () => {
    const text =
      "Focus on hydration today—your barrier needs support. Keep actives light–moderate for now.";
    const sanitized = sanitizeSkinStrategyText(text);
    expect(sanitized).not.toContain("—");
    expect(sanitized).not.toContain("–");
  });

  it("replaces an em dash with a comma", () => {
    expect(sanitizeSkinStrategyText("Keep it gentle—consistency matters most.")).toBe(
      "Keep it gentle, consistency matters most.",
    );
  });

  it("replaces an en dash with a plain hyphen", () => {
    expect(sanitizeSkinStrategyText("Aim for a light–moderate routine today.")).toBe(
      "Aim for a light-moderate routine today.",
    );
  });

  it("leaves text with no dashes completely unchanged", () => {
    const text = "Focus on hydration today, and keep your routine consistent.";
    expect(sanitizeSkinStrategyText(text)).toBe(text);
  });
});
