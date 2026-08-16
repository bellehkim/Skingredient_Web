import { describe, expect, it } from "vitest";
import { calculateCheckInStreak } from "./streak";

const TODAY = new Date(2026, 7, 15); // Aug 15, 2026

describe("calculateCheckInStreak", () => {
  it("returns 0 when there are no check-ins", () => {
    expect(calculateCheckInStreak([], TODAY)).toBe(0);
  });

  it("counts today plus consecutive prior days", () => {
    const dates = ["2026-08-15", "2026-08-14", "2026-08-13"];
    expect(calculateCheckInStreak(dates, TODAY)).toBe(3);
  });

  it("still counts the streak through yesterday if today hasn't checked in yet", () => {
    const dates = ["2026-08-14", "2026-08-13"];
    expect(calculateCheckInStreak(dates, TODAY)).toBe(2);
  });

  it("stops at the first gap", () => {
    const dates = ["2026-08-15", "2026-08-14", "2026-08-12"];
    expect(calculateCheckInStreak(dates, TODAY)).toBe(2);
  });

  it("is 0 if the most recent check-in was more than a day ago", () => {
    const dates = ["2026-08-10"];
    expect(calculateCheckInStreak(dates, TODAY)).toBe(0);
  });

  it("ignores unrelated future dates", () => {
    const dates = ["2026-08-20", "2026-08-15", "2026-08-14"];
    expect(calculateCheckInStreak(dates, TODAY)).toBe(2);
  });
});
