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

  // Overall Condition describes today's state, not a skin type — labels are
  // score bands (Excellent/Healthy/Balanced/Needs Support/Compromised), with
  // one override: notably high redness always reads "Reactive" regardless
  // of score, since that's a distinct actionable state, not a type word
  // like the old per-concern labels ("Blemish-Prone" etc.) were.
  it("labels score bands as Excellent/Healthy/Balanced/Needs Support/Compromised", () => {
    const withScore = (allFieldsValue: number) =>
      deriveOverallCondition(
        analysis({
          redness: allFieldsValue,
          hydration: allFieldsValue,
          oiliness: allFieldsValue,
          acne: allFieldsValue,
          pores: allFieldsValue,
          texture: allFieldsValue,
          ageSpots: allFieldsValue,
        }),
      );

    expect(withScore(90).label).toBe("Excellent");
    expect(withScore(75).label).toBe("Healthy");
    expect(withScore(60).label).toBe("Balanced");
    // Matches the reported case: acne 32, hydration 48 → score 53.
    expect(
      deriveOverallCondition(
        analysis({
          redness: 72,
          hydration: 48,
          oiliness: 52,
          acne: 32,
          pores: 41,
          texture: 55,
          ageSpots: 64,
        }),
      ).label,
    ).toBe("Needs Support");
    // Keep redness healthy here so the Reactive override (tested separately
    // below) doesn't mask the Compromised band.
    expect(
      deriveOverallCondition(
        analysis({
          redness: 90,
          hydration: 5,
          oiliness: 5,
          acne: 5,
          pores: 5,
          texture: 5,
          ageSpots: 5,
        }),
      ).label,
    ).toBe("Compromised");
  });

  it("labels as Reactive whenever redness is Needs Attention tier, regardless of overall score", () => {
    // High overall score, but redness itself is notably low.
    const { label, score } = deriveOverallCondition(
      analysis({
        redness: 30,
        hydration: 90,
        oiliness: 90,
        acne: 90,
        pores: 90,
        texture: 90,
        ageSpots: 90,
      }),
    );
    expect(score).toBeGreaterThan(69);
    expect(label).toBe("Reactive");
  });

  it("does not use per-concern skin-type-sounding words (that belongs to deriveSkinType)", () => {
    const acneDominant = deriveOverallCondition(
      analysis({
        redness: 50,
        hydration: 50,
        oiliness: 50,
        acne: 10,
        pores: 50,
        texture: 50,
        ageSpots: 50,
      }),
    );
    expect(acneDominant.label).not.toBe("Blemish-Prone");
    expect(acneDominant.label).not.toBe("Uneven");
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
