import { describe, expect, it } from "vitest";
import { applyScheduleAdjustment, resolveScheduleOption } from "./scheduleAdjustments";

describe("resolveScheduleOption", () => {
  it("returns 'none' when nothing is selected", () => {
    expect(resolveScheduleOption([])).toBe("none");
  });

  it("maps each existing check-in chip to its schedule option", () => {
    expect(resolveScheduleOption(["Date or special event"])).toBe("important-event");
    expect(resolveScheduleOption(["Outdoor activity"])).toBe("outdoor-day");
    expect(resolveScheduleOption(["Travel"])).toBe("travel");
    expect(resolveScheduleOption(["Cosmetic treatment"])).toBe("cosmetic-treatment");
    expect(resolveScheduleOption(["Nothing special"])).toBe("none");
  });

  it("resolves multi-select via fixed priority: important-event > travel > outdoor-day", () => {
    expect(resolveScheduleOption(["Outdoor activity", "Date or special event"])).toBe(
      "important-event",
    );
    expect(resolveScheduleOption(["Outdoor activity", "Travel"])).toBe("travel");
  });
});

describe("applyScheduleAdjustment", () => {
  const acneBaseline = {
    prioritizedIngredients: ["Salicylic Acid", "Azelaic Acid", "Niacinamide"],
    avoidedIngredients: ["Multiple exfoliating actives at once", "Heavy occlusives"],
    explanation: "Focus on gentle blemish control without overloading actives.",
  };

  it("matches the worked example: acne baseline + important event → Niacinamide, Ceramides, Panthenol", () => {
    const adjusted = applyScheduleAdjustment(acneBaseline, "important-event");
    expect(adjusted.prioritizedIngredients).toEqual(["Niacinamide", "Ceramides", "Panthenol"]);
    expect(adjusted.avoidedIngredients).toEqual(
      expect.arrayContaining(["Salicylic Acid", "Azelaic Acid", "Retinoids", "AHA", "BHA"]),
    );
  });

  it("does not drop a gentle ingredient (Niacinamide) that isn't a strong active", () => {
    const adjusted = applyScheduleAdjustment(acneBaseline, "important-event");
    expect(adjusted.prioritizedIngredients).toContain("Niacinamide");
  });

  it("travel applies the same barrier-support strategy as important-event", () => {
    const adjusted = applyScheduleAdjustment(acneBaseline, "travel");
    expect(adjusted.prioritizedIngredients).not.toContain("Salicylic Acid");
    expect(adjusted.avoidedIngredients).toContain("Salicylic Acid");
  });

  it("outdoor-day adds Sunscreen without removing existing prioritized ingredients", () => {
    const adjusted = applyScheduleAdjustment(acneBaseline, "outdoor-day");
    expect(adjusted.prioritizedIngredients).toContain("Sunscreen");
    expect(adjusted.prioritizedIngredients).toEqual(
      expect.arrayContaining(acneBaseline.prioritizedIngredients),
    );
  });

  it("none and cosmetic-treatment are no-ops", () => {
    expect(applyScheduleAdjustment(acneBaseline, "none")).toEqual(acneBaseline);
    expect(applyScheduleAdjustment(acneBaseline, "cosmetic-treatment")).toEqual(acneBaseline);
  });

  it("does not contradict a barrier-recovery baseline that's already gentle", () => {
    const barrierBaseline = {
      prioritizedIngredients: ["Ceramides", "Panthenol", "Glycerin", "Beta-Glucan", "Squalane"],
      avoidedIngredients: ["Retinoids", "AHA", "BHA", "Benzoyl Peroxide", "Strong Vitamin C"],
      explanation: "Your skin looks dehydrated and slightly reactive today.",
    };
    const adjusted = applyScheduleAdjustment(barrierBaseline, "important-event");
    // Nothing strong to remove, so the gentle baseline passes through unchanged.
    expect(adjusted.prioritizedIngredients).toEqual(barrierBaseline.prioritizedIngredients);
  });
});
