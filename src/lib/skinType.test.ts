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

  it("classifies a low oiliness score as Oily regardless of hydration", () => {
    expect(deriveSkinType(analysis({ oiliness: 20, hydration: 90 }))).toBe("Oily");
    expect(deriveSkinType(analysis({ oiliness: 20, hydration: 10 }))).toBe("Oily");
  });

  it("classifies low hydration + high oiliness score as Dry", () => {
    expect(deriveSkinType(analysis({ hydration: 30, oiliness: 80 }))).toBe("Dry");
  });

  it("classifies high hydration + high oiliness score as Balanced", () => {
    expect(deriveSkinType(analysis({ hydration: 80, oiliness: 80 }))).toBe("Balanced");
  });

  it("classifies mid hydration + mid oiliness score as Combination", () => {
    expect(deriveSkinType(analysis({ hydration: 50, oiliness: 50 }))).toBe("Combination");
  });

  it("classifies the reported case (hydration 48, oiliness 52) as Combination", () => {
    expect(deriveSkinType(analysis({ hydration: 48, oiliness: 52 }))).toBe("Combination");
  });

  it("does not classify mid-range 'not technically low' hydration as Balanced", () => {
    // Old permissive rule would have called this Balanced (hydration > 45,
    // oiliness >= 70). Balanced now requires hydration to be genuinely HIGH.
    expect(deriveSkinType(analysis({ hydration: 46, oiliness: 80 }))).toBe("Combination");
  });

  it("classifies high oiliness score + mid-range hydration as Combination, not Dry", () => {
    // Not low enough hydration to be Dry, not high enough to be Balanced.
    expect(deriveSkinType(analysis({ hydration: 60, oiliness: 80 }))).toBe("Combination");
  });

  it("only ever returns one of the four allowed skin types — no condition words", () => {
    const result = deriveSkinType(analysis({ oiliness: 20, hydration: 40, redness: 20 }));
    expect(["Dry", "Combination", "Oily", "Balanced"]).toContain(result);
  });

  it("does not use acne, pores, ageSpots, texture, or redness in the classification", () => {
    const base = analysis({ oiliness: 50, hydration: 60, redness: 80 });
    const changed = { ...base, acne: 1, pores: 1, ageSpots: 1, texture: 1, redness: 1 };
    expect(deriveSkinType(base)).toEqual(deriveSkinType(changed));
  });
});
