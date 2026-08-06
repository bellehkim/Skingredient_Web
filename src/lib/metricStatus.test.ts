import { describe, expect, it } from "vitest";
import { getMetricLabel } from "./metricStatus";

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
