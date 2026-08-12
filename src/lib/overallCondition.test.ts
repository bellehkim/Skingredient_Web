import { describe, expect, it } from "vitest";
import { deriveOverallCondition } from "./overallCondition";
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

describe("deriveOverallCondition", () => {
  it("is deterministic — same input always yields the same output", () => {
    const a = analysis({ redness: 20 });
    expect(deriveOverallCondition(a)).toEqual(deriveOverallCondition(a));
  });

  it("does not double-invert: a uniformly healthy analysis scores near the input value, not near 0", () => {
    const { score } = deriveOverallCondition(analysis({}));
    expect(score).toBe(80);
  });

  it("a uniformly unhealthy analysis scores low, not high", () => {
    const { score } = deriveOverallCondition(
      analysis({
        redness: 10,
        hydration: 10,
        oiliness: 10,
        acne: 10,
        pores: 10,
        texture: 10,
        ageSpots: 10,
      }),
    );
    expect(score).toBe(10);
  });

  it("weights sum to a full-scale average (100 in, 100 out)", () => {
    const { score } = deriveOverallCondition(
      analysis({
        redness: 100,
        hydration: 100,
        oiliness: 100,
        acne: 100,
        pores: 100,
        texture: 100,
        ageSpots: 100,
      }),
    );
    expect(score).toBe(100);
  });

  it("labels a low score as Reactive, mid as Uneven, high as Balanced", () => {
    expect(
      deriveOverallCondition(
        analysis({
          redness: 10,
          hydration: 10,
          oiliness: 10,
          acne: 10,
          pores: 10,
          texture: 10,
          ageSpots: 10,
        }),
      ).label,
    ).toBe("Reactive");
    expect(
      deriveOverallCondition(
        analysis({
          redness: 50,
          hydration: 50,
          oiliness: 50,
          acne: 50,
          pores: 50,
          texture: 50,
          ageSpots: 50,
        }),
      ).label,
    ).toBe("Uneven");
    expect(deriveOverallCondition(analysis({})).label).toBe("Balanced");
  });

  it("names the single worst-scoring metric in the description", () => {
    const { description } = deriveOverallCondition(analysis({ redness: 5 }));
    expect(description).toContain("redness");
  });

  it("labels ageSpots as 'dark spots' in the description, not 'age spots'", () => {
    const { description } = deriveOverallCondition(analysis({ ageSpots: 5 }));
    expect(description).toContain("dark spots");
    expect(description).not.toContain("age spots");
  });

  it("does not produce NaN when a field is missing (e.g. stale/partial data)", () => {
    const incomplete = { ...analysis({}) } as Partial<SkinAnalysisResult>;
    delete incomplete.ageSpots;
    const { score } = deriveOverallCondition(incomplete as SkinAnalysisResult);
    expect(Number.isNaN(score)).toBe(false);
  });

  it("does not produce NaN when a field is explicitly non-finite", () => {
    const { score } = deriveOverallCondition(analysis({ ageSpots: NaN }));
    expect(Number.isNaN(score)).toBe(false);
  });

  it("excludes a missing field from the average rather than treating it as 0", () => {
    // Every present field is 80; ageSpots missing should still average to 80,
    // not drag the score down as if ageSpots were 0.
    const incomplete = { ...analysis({}) } as Partial<SkinAnalysisResult>;
    delete incomplete.ageSpots;
    const { score } = deriveOverallCondition(incomplete as SkinAnalysisResult);
    expect(score).toBe(80);
  });
});
