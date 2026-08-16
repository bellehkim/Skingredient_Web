import { describe, expect, it } from "vitest";
import { generateRecommendation } from "@/lib/recommendationEngine";
import { deriveOverallCondition } from "@/lib/overallCondition";
import {
  DEMO_ANALYSIS,
  DEMO_ANALYSIS_HISTORY,
  DEMO_EVENT_TIMING,
  DEMO_SCHEDULE_OPTION,
  getDemoHistoryProductIds,
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
  it("has 5 entries", () => {
    expect(DEMO_ANALYSIS_HISTORY).toHaveLength(5);
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

  it("gives every entry a stable demo-prefixed id that can never collide with a real Supabase uuid", () => {
    for (const entry of DEMO_ANALYSIS_HISTORY) {
      expect(entry.id).toMatch(/^demo-\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("gives every entry a unique id", () => {
    const ids = DEMO_ANALYSIS_HISTORY.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has today's entry (index 0) id match DEMO_ANALYSIS_HISTORY's own analyzedAt day", () => {
    const today = new Date(DEMO_ANALYSIS_HISTORY[0].analyzedAt);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    expect(DEMO_ANALYSIS_HISTORY[0].id).toBe(`demo-${year}-${month}-${day}`);
  });

  it("produces an approximately 48 -> 49 -> 50 -> 51 -> 53 Overall Condition score, oldest to newest", () => {
    const scores = DEMO_ANALYSIS_HISTORY.map((a) => deriveOverallCondition(a).score).reverse();
    expect(scores).toEqual([48, 49, 50, 51, 53]);
  });

  it("keeps every entry's Overall Condition label at Needs Support", () => {
    for (const entry of DEMO_ANALYSIS_HISTORY) {
      expect(deriveOverallCondition(entry).label).toBe("Needs Support");
    }
  });

  it("doesn't move pores or dark spots dramatically day to day", () => {
    const pores = DEMO_ANALYSIS_HISTORY.map((a) => a.pores);
    const ageSpots = DEMO_ANALYSIS_HISTORY.map((a) => a.ageSpots);
    expect(Math.max(...pores) - Math.min(...pores)).toBeLessThanOrEqual(5);
    expect(Math.max(...ageSpots) - Math.min(...ageSpots)).toBeLessThanOrEqual(5);
  });
});

describe("getDemoHistoryProductIds", () => {
  it("returns 6 product ids, one per canonical routine step, for every history entry", () => {
    for (const entry of DEMO_ANALYSIS_HISTORY) {
      expect(getDemoHistoryProductIds(entry.id ?? "")).toHaveLength(6);
    }
  });

  it("returns an empty list for an id that isn't a recognized demo history entry", () => {
    expect(getDemoHistoryProductIds("demo-1999-01-01")).toEqual([]);
  });

  it("matches today's product ids exactly with the established current demo recommendation", () => {
    expect(getDemoHistoryProductIds(DEMO_ANALYSIS_HISTORY[0].id ?? "")).toEqual([
      "1",
      "17",
      "10",
      "5",
      "16",
      "7",
    ]);
  });

  it("keeps adjacent days sharing at least 5 of 6 products", () => {
    for (let i = 1; i < DEMO_ANALYSIS_HISTORY.length; i++) {
      const prev = getDemoHistoryProductIds(DEMO_ANALYSIS_HISTORY[i - 1].id ?? "");
      const curr = getDemoHistoryProductIds(DEMO_ANALYSIS_HISTORY[i].id ?? "");
      const shared = curr.filter((id, idx) => id === prev[idx]).length;
      expect(shared).toBeGreaterThanOrEqual(5);
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
