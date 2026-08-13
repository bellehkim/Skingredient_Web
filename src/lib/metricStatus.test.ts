import { describe, expect, it } from "vitest";
import { getMetricLabel, getMetricStatusText } from "./metricStatus";

describe("getMetricLabel", () => {
  it("labels low scores as Needs Attention", () => {
    expect(getMetricLabel(0)).toBe("Needs Attention");
    expect(getMetricLabel(39)).toBe("Needs Attention");
  });

  it("labels mid-range scores as Moderate", () => {
    expect(getMetricLabel(40)).toBe("Moderate");
    expect(getMetricLabel(69)).toBe("Moderate");
  });

  it("labels high scores as Good", () => {
    expect(getMetricLabel(70)).toBe("Good");
    expect(getMetricLabel(100)).toBe("Good");
  });

  it("treats higher scores as strictly healthier (monotonic, never inverted)", () => {
    const order: Array<ReturnType<typeof getMetricLabel>> = ["Needs Attention", "Moderate", "Good"];
    const samples = [5, 25, 45, 65, 85, 99];
    let lastRank = -1;
    for (const value of samples) {
      const rank = order.indexOf(getMetricLabel(value));
      expect(rank).toBeGreaterThanOrEqual(lastRank);
      lastRank = rank;
    }
  });
});

describe("getMetricStatusText", () => {
  it("maps redness to its own word per band", () => {
    expect(getMetricStatusText("redness", 95)).toBe("Minimal");
    expect(getMetricStatusText("redness", 85)).toBe("Low");
    expect(getMetricStatusText("redness", 75)).toBe("Mild");
    expect(getMetricStatusText("redness", 65)).toBe("Moderate");
    expect(getMetricStatusText("redness", 30)).toBe("High");
  });

  it("maps hydration to its own word per band", () => {
    expect(getMetricStatusText("hydration", 95)).toBe("Deeply Hydrated");
    expect(getMetricStatusText("hydration", 85)).toBe("Hydrated");
    expect(getMetricStatusText("hydration", 75)).toBe("Adequate");
    expect(getMetricStatusText("hydration", 65)).toBe("Low");
    expect(getMetricStatusText("hydration", 30)).toBe("Dehydrated");
  });

  it("gives every metric a distinct word set (no blanket 'Good')", () => {
    const fields = ["redness", "oiliness", "acne", "pores", "texture", "ageSpots"] as const;
    for (const field of fields) {
      expect(getMetricStatusText(field, 95)).not.toBe("Good");
    }
  });

  it("respects exact band boundaries", () => {
    expect(getMetricStatusText("acne", 90)).toBe("Clear");
    expect(getMetricStatusText("acne", 89)).toBe("Mostly Clear");
    expect(getMetricStatusText("acne", 60)).toBe("Moderate");
    expect(getMetricStatusText("acne", 59)).toBe("Breakout-Prone");
    expect(getMetricStatusText("acne", 0)).toBe("Breakout-Prone");
  });
});
