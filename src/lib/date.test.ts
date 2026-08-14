import { describe, expect, it } from "vitest";
import { todayDateString } from "./date";

describe("todayDateString", () => {
  it("zero-pads single-digit months and days", () => {
    expect(todayDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("does not zero-pad when not needed", () => {
    expect(todayDateString(new Date(2026, 10, 23))).toBe("2026-11-23");
  });

  it("uses local date fields, not UTC ones", () => {
    // Local midnight on the 1st should never read back as the last day of
    // the previous month regardless of the machine's UTC offset.
    const d = new Date(2026, 5, 1, 0, 30);
    expect(todayDateString(d)).toBe("2026-06-01");
  });
});
