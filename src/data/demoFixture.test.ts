import { describe, expect, it } from "vitest";
import { generateRecommendation } from "@/lib/recommendationEngine";
import { deriveOverallCondition } from "@/lib/overallCondition";
import {
  DEMO_ANALYSIS,
  DEMO_ANALYSIS_HISTORY,
  DEMO_EVENT_TIMING,
  DEMO_SCHEDULE_OPTION,
} from "./demoFixture";

const METRIC_KEYS = [
  "redness",
  "hydration",
  "oiliness",
  "acne",
  "pores",
  "texture",
  "ageSpots",
] as const;

describe("DEMO_ANALYSIS_HISTORY", () => {
  it("has 6 entries", () => {
    expect(DEMO_ANALYSIS_HISTORY).toHaveLength(6);
  });

  it("has today's entry (index 0) match DEMO_ANALYSIS exactly", () => {
    for (const key of METRIC_KEYS) {
      expect(DEMO_ANALYSIS_HISTORY[0][key]).toBe(DEMO_ANALYSIS[key]);
    }
  });

  it("is ordered newest first", () => {
    const times = DEMO_ANALYSIS_HISTORY.map((a) => new Date(a.analyzedAt).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i - 1]).toBeGreaterThan(times[i]);
    }
  });

  it("shows acne improving (increasing, higher = healthier) over time, without a perfectly linear step size", () => {
    // Oldest -> newest.
    const acne = DEMO_ANALYSIS_HISTORY.map((a) => a.acne).reverse();
    for (let i = 1; i < acne.length; i++) {
      expect(acne[i]).toBeGreaterThan(acne[i - 1]);
    }
    const deltas = acne.slice(1).map((v, i) => v - acne[i]);
    expect(new Set(deltas).size).toBeGreaterThan(1);
  });

  it("keeps every metric within the valid 0-100 range", () => {
    for (const entry of DEMO_ANALYSIS_HISTORY) {
      for (const key of METRIC_KEYS) {
        expect(entry[key]).toBeGreaterThanOrEqual(0);
        expect(entry[key]).toBeLessThanOrEqual(100);
      }
    }
  });
});

// Locks in the approved Demo Mode scenario: skin condition drives Blemish
// Control, and the outdoor-day-tomorrow adjustment keeps today's plan
// predictable (no Sunscreen inserted, no dropped blemish-control actives)
// while adding a conservative Retinoids caution and emphasizing tomorrow's
// sun protection in the explanation — see src/routes/scan.index.tsx's
// `demo` branch and src/lib/scheduleAdjustments.ts's sunProtectionForTiming.
describe("DEMO_ANALYSIS scenario", () => {
  const analysis = { ...DEMO_ANALYSIS, analyzedAt: new Date().toISOString() };

  it("lands in Needs Support, not a boundary or Reactive override", () => {
    const { label } = deriveOverallCondition(analysis);
    expect(label).toBe("Needs Support");
  });

  it("triggers Blemish Control from the skin condition alone (no schedule)", () => {
    const rec = generateRecommendation({
      analysis,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
    });
    expect(rec.direction).toBe("blemish-control");
    expect(rec.prioritizedIngredients).toContain("Salicylic Acid");
    expect(rec.prioritizedIngredients).not.toContain("Sunscreen");
  });

  it("keeps today's Blemish Control priorities unchanged when the outdoor-day/tomorrow schedule is forced, without inserting Sunscreen", () => {
    const rec = generateRecommendation({
      analysis,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
      scheduleTomorrow: DEMO_SCHEDULE_OPTION,
      eventTiming: DEMO_EVENT_TIMING,
    });
    expect(rec.direction).toBe("blemish-control");
    expect(rec.riskLevel).toBe("moderate");
    expect(rec.prioritizedIngredients).toEqual([
      "Salicylic Acid",
      "Azelaic Acid",
      "Niacinamide",
      "Ceramides",
      "Panthenol",
    ]);
    expect(rec.prioritizedIngredients).not.toContain("Sunscreen");
  });

  it("adds Retinoids to avoided (a conservative, single-ingredient caution) without a blanket ban on other exfoliating actives", () => {
    const rec = generateRecommendation({
      analysis,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
      scheduleTomorrow: DEMO_SCHEDULE_OPTION,
      eventTiming: DEMO_EVENT_TIMING,
    });
    expect(rec.avoidedIngredients).toEqual(
      expect.arrayContaining(["Multiple exfoliating actives at once", "Retinoids"]),
    );
    expect(rec.avoidedIngredients).not.toContain("AHA");
    expect(rec.avoidedIngredients).not.toContain("BHA");
    expect(rec.avoidedIngredients).not.toContain("Salicylic Acid");
  });

  it("mentions tomorrow's sunscreen/UV context in the explanation, without an em dash", () => {
    const rec = generateRecommendation({
      analysis,
      symptoms: [],
      sensitivities: [],
      recentActives: [],
      scheduleTomorrow: DEMO_SCHEDULE_OPTION,
      eventTiming: DEMO_EVENT_TIMING,
    });
    expect(rec.explanation.toLowerCase()).toContain("sunscreen");
    expect(rec.explanation.toLowerCase()).toContain("tomorrow");
    expect(rec.explanation).not.toContain("—");
  });
});
