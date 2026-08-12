import { describe, expect, it } from "vitest";
import { normalize, scoreFor, type YouCamTaskResultItem } from "./skin-analysis";

function item(type: string, ui_score: number): YouCamTaskResultItem {
  return { type, ui_score, raw_score: ui_score, mask_urls: [] };
}

const RAW_OUTPUT: YouCamTaskResultItem[] = [
  item("oiliness", 68),
  item("texture", 76),
  item("pore", 61),
  item("moisture", 73),
  item("redness", 81),
  item("acne", 99),
  item("age_spot", 85),
];

describe("normalize", () => {
  it("passes ui_score through unmodified for every metric (no inversion)", () => {
    const result = normalize(RAW_OUTPUT);
    expect(result.redness).toBe(81);
    expect(result.acne).toBe(99);
    expect(result.oiliness).toBe(68);
    expect(result.texture).toBe(76);
  });

  it("maps moisture -> hydration", () => {
    expect(normalize(RAW_OUTPUT).hydration).toBe(73);
  });

  it("maps pore -> pores", () => {
    expect(normalize(RAW_OUTPUT).pores).toBe(61);
  });

  it("maps age_spot -> ageSpots, no inversion", () => {
    expect(normalize(RAW_OUTPUT).ageSpots).toBe(85);
  });

  it("matches the full expected mapping for a real sample response", () => {
    expect(normalize(RAW_OUTPUT)).toMatchObject({
      redness: 81,
      hydration: 73,
      acne: 99,
      oiliness: 68,
      texture: 76,
      pores: 61,
      ageSpots: 85,
    });
  });

  it("never inverts via 100 - ui_score", () => {
    const result = normalize(RAW_OUTPUT);
    expect(result.redness).not.toBe(100 - 81);
    expect(result.acne).not.toBe(100 - 99);
    expect(result.oiliness).not.toBe(100 - 68);
    expect(result.texture).not.toBe(100 - 76);
    expect(result.pores).not.toBe(100 - 61);
    expect(result.ageSpots).not.toBe(100 - 85);
  });

  it("keeps every score within the 0-100 range", () => {
    const result = normalize(RAW_OUTPUT);
    for (const value of [
      result.redness,
      result.hydration,
      result.acne,
      result.oiliness,
      result.texture,
      result.pores,
      result.ageSpots,
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("throws if a required concern is missing from the YouCam response", () => {
    expect(() => normalize(RAW_OUTPUT.filter((o) => o.type !== "acne"))).toThrow();
  });
});

describe("scoreFor", () => {
  it("finds the ui_score for a given concern type", () => {
    expect(scoreFor(RAW_OUTPUT, "redness")).toBe(81);
  });

  it("returns undefined for a concern not present", () => {
    expect(scoreFor(RAW_OUTPUT, "skin_age")).toBeUndefined();
  });
});
