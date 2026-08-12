import { describe, expect, it } from "vitest";
import { deriveSkinType } from "./skinType";
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

describe("deriveSkinType", () => {
  it("is deterministic — same input always yields the same output", () => {
    const a = analysis({ oiliness: 25, hydration: 30, redness: 20 });
    expect(deriveSkinType(a)).toEqual(deriveSkinType(a));
  });

  it("classifies low oiliness as Oily regardless of hydration", () => {
    expect(deriveSkinType(analysis({ oiliness: 20, hydration: 80 })).baseType).toBe("Oily");
  });

  it("classifies high oiliness + low hydration as Dry", () => {
    expect(deriveSkinType(analysis({ oiliness: 80, hydration: 40 })).baseType).toBe("Dry");
  });

  it("classifies high oiliness + adequate hydration as Balanced", () => {
    expect(deriveSkinType(analysis({ oiliness: 80, hydration: 60 })).baseType).toBe("Balanced");
  });

  it("classifies moderate oiliness + low hydration as Combination", () => {
    expect(deriveSkinType(analysis({ oiliness: 50, hydration: 40 })).baseType).toBe("Combination");
  });

  it("classifies moderate oiliness + adequate hydration as Balanced", () => {
    expect(deriveSkinType(analysis({ oiliness: 50, hydration: 60 })).baseType).toBe("Balanced");
  });

  it("adds a Dehydrated modifier from hydration, without forcing baseType to Dry", () => {
    // Oily base (low oiliness) that also happens to be dehydrated — matches
    // the "Oily · Dehydrated" example from the spec.
    const result = deriveSkinType(analysis({ oiliness: 20, hydration: 40, redness: 80 }));
    expect(result.baseType).toBe("Oily");
    expect(result.modifiers).toContain("Dehydrated");
    expect(result.label).toBe("Oily · Dehydrated");
  });

  it("adds a Reactive modifier from redness independently of base type", () => {
    const result = deriveSkinType(analysis({ oiliness: 50, hydration: 60, redness: 20 }));
    expect(result.modifiers).toContain("Reactive");
    expect(result.label).toBe("Balanced · Reactive");
  });

  it("has no modifiers and a plain label when nothing is out of range", () => {
    const result = deriveSkinType(analysis({ oiliness: 80, hydration: 80, redness: 80 }));
    expect(result.modifiers).toEqual([]);
    expect(result.label).toBe("Balanced");
  });

  it("does not use acne, pores, ageSpots, or texture in the classification", () => {
    const base = analysis({ oiliness: 50, hydration: 60, redness: 80 });
    const changed = { ...base, acne: 1, pores: 1, ageSpots: 1, texture: 1 };
    expect(deriveSkinType(base)).toEqual(deriveSkinType(changed));
  });
});
