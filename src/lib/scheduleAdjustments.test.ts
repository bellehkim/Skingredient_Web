import { describe, expect, it } from "vitest";
import {
  applyScheduleAdjustment,
  resolveEventTiming,
  resolveScheduleOption,
} from "./scheduleAdjustments";

describe("resolveScheduleOption", () => {
  it("returns 'none' when nothing is selected", () => {
    expect(resolveScheduleOption(null)).toBe("none");
  });

  it("maps each single-select check-in chip to its schedule option", () => {
    expect(resolveScheduleOption("Important event")).toBe("important-event");
    expect(resolveScheduleOption("Outdoor activity")).toBe("outdoor-day");
    expect(resolveScheduleOption("Travel")).toBe("travel");
    expect(resolveScheduleOption("Cosmetic treatment")).toBe("cosmetic-treatment");
    expect(resolveScheduleOption("Nothing special")).toBe("none");
  });

  it("falls back to 'none' for an unrecognized chip label", () => {
    expect(resolveScheduleOption("Not a real chip")).toBe("none");
  });
});

describe("resolveEventTiming", () => {
  it("returns 'none' when nothing is selected", () => {
    expect(resolveEventTiming(null)).toBe("none");
  });

  it("maps each single-select timing chip to its EventTiming", () => {
    expect(resolveEventTiming("Tomorrow")).toBe("tomorrow");
    expect(resolveEventTiming("Within 3 days")).toBe("three-days");
    expect(resolveEventTiming("Within a week")).toBe("week");
  });

  it("falls back to 'none' for an unrecognized chip label", () => {
    expect(resolveEventTiming("Not a real chip")).toBe("none");
  });
});

describe("applyScheduleAdjustment", () => {
  const acneBaseline = {
    prioritizedIngredients: ["Salicylic Acid", "Azelaic Acid", "Niacinamide"],
    avoidedIngredients: ["Multiple exfoliating actives at once", "Heavy occlusives"],
    explanation: "Focus on gentle blemish control without overloading actives.",
  };

  describe("timing: tomorrow (full strength)", () => {
    it("matches the worked example: acne baseline + important event tomorrow → Niacinamide, Ceramides, Panthenol", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "important-event", "tomorrow");
      expect(adjusted.prioritizedIngredients).toEqual(["Niacinamide", "Ceramides", "Panthenol"]);
      expect(adjusted.avoidedIngredients).toEqual(
        expect.arrayContaining(["Salicylic Acid", "Azelaic Acid", "Retinoids", "AHA", "BHA"]),
      );
    });

    it("does not drop a gentle ingredient (Niacinamide) that isn't a strong active", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "important-event", "tomorrow");
      expect(adjusted.prioritizedIngredients).toContain("Niacinamide");
    });

    it("travel applies the same barrier-support strategy as important-event", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "travel", "tomorrow");
      expect(adjusted.prioritizedIngredients).not.toContain("Salicylic Acid");
      expect(adjusted.avoidedIngredients).toContain("Salicylic Acid");
    });

    it("cosmetic-treatment applies the same barrier-support strategy as important-event", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "cosmetic-treatment", "tomorrow");
      expect(adjusted.prioritizedIngredients).not.toContain("Salicylic Acid");
      expect(adjusted.avoidedIngredients).toEqual(
        expect.arrayContaining(["Salicylic Acid", "Azelaic Acid", "Retinoids", "AHA", "BHA"]),
      );
    });

    it("outdoor-day adds Sunscreen without removing existing prioritized ingredients", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "outdoor-day", "tomorrow");
      expect(adjusted.prioritizedIngredients).toContain("Sunscreen");
      expect(adjusted.prioritizedIngredients).toEqual(
        expect.arrayContaining(acneBaseline.prioritizedIngredients),
      );
    });

    it("does not contradict a barrier-recovery baseline that's already gentle", () => {
      const barrierBaseline = {
        prioritizedIngredients: ["Ceramides", "Panthenol", "Glycerin", "Beta-Glucan", "Squalane"],
        avoidedIngredients: ["Retinoids", "AHA", "BHA", "Benzoyl Peroxide", "Strong Vitamin C"],
        explanation: "Your skin looks dehydrated and slightly reactive today.",
      };
      const adjusted = applyScheduleAdjustment(barrierBaseline, "important-event", "tomorrow");
      // Nothing strong to remove, so the gentle baseline passes through unchanged.
      expect(adjusted.prioritizedIngredients).toEqual(barrierBaseline.prioritizedIngredients);
    });
  });

  describe("timing: three-days (moderate strength)", () => {
    it("moves strong actives out of prioritized without padding back up with barrier ingredients", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "important-event", "three-days");
      expect(adjusted.prioritizedIngredients).toEqual(["Niacinamide"]);
      expect(adjusted.prioritizedIngredients).not.toContain("Ceramides");
      expect(adjusted.avoidedIngredients).toContain("Salicylic Acid");
    });

    it("outdoor-day still adds Sunscreen", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "outdoor-day", "three-days");
      expect(adjusted.prioritizedIngredients).toContain("Sunscreen");
    });
  });

  describe("timing: week (informational only)", () => {
    it("leaves prioritized/avoided ingredients untouched, only adds a note", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "important-event", "week");
      expect(adjusted.prioritizedIngredients).toEqual(acneBaseline.prioritizedIngredients);
      expect(adjusted.avoidedIngredients).toEqual(acneBaseline.avoidedIngredients);
      expect(adjusted.explanation.length).toBeGreaterThan(acneBaseline.explanation.length);
    });

    it("outdoor-day does not add Sunscreen at week-level timing", () => {
      const adjusted = applyScheduleAdjustment(acneBaseline, "outdoor-day", "week");
      expect(adjusted.prioritizedIngredients).toEqual(acneBaseline.prioritizedIngredients);
    });
  });

  it("option 'none' is always a no-op regardless of timing", () => {
    expect(applyScheduleAdjustment(acneBaseline, "none", "tomorrow")).toEqual(acneBaseline);
  });

  it("timing 'none' is always a no-op regardless of option", () => {
    expect(applyScheduleAdjustment(acneBaseline, "important-event", "none")).toEqual(acneBaseline);
  });
});
