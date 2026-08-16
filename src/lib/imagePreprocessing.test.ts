import { describe, expect, it } from "vitest";
import { computeTargetDimensions, MAX_LONG_EDGE } from "./imagePreprocessing";

describe("computeTargetDimensions", () => {
  it("leaves an already-small image unchanged", () => {
    expect(computeTargetDimensions(960, 1280)).toEqual({ width: 960, height: 1280, scaled: false });
  });

  it("leaves an image exactly at the cap unchanged", () => {
    expect(computeTargetDimensions(MAX_LONG_EDGE, 1000)).toEqual({
      width: MAX_LONG_EDGE,
      height: 1000,
      scaled: false,
    });
  });

  it("scales down a wide image, preserving aspect ratio", () => {
    // 4032x3024 (a typical phone photo, 4:3 landscape) -> long edge 4032 capped to 1920
    const result = computeTargetDimensions(4032, 3024);
    expect(result.scaled).toBe(true);
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1440); // 3024 * (1920 / 4032)
    expect(result.width / result.height).toBeCloseTo(4032 / 3024, 2);
  });

  it("scales down a tall image, preserving aspect ratio", () => {
    // 3024x4032 (portrait phone photo) -> long edge 4032 capped to 1920
    const result = computeTargetDimensions(3024, 4032);
    expect(result.scaled).toBe(true);
    expect(result.height).toBe(1920);
    expect(result.width).toBe(1440);
  });

  it("never upscales a smaller image", () => {
    const result = computeTargetDimensions(400, 300, MAX_LONG_EDGE);
    expect(result).toEqual({ width: 400, height: 300, scaled: false });
  });
});
