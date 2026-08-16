import { describe, expect, it } from "vitest";
import { sanitizeSkinDirectionText } from "./skinDirectionService";

describe("sanitizeSkinDirectionText", () => {
  it("replaces an em dash with a comma", () => {
    expect(sanitizeSkinDirectionText("Your skin looks solid today—focus on hydration.")).toBe(
      "Your skin looks solid today, focus on hydration.",
    );
  });

  it("replaces an en dash with a plain hyphen", () => {
    expect(sanitizeSkinDirectionText("Aim for a light–moderate routine today.")).toBe(
      "Aim for a light-moderate routine today.",
    );
  });

  it("leaves text with no dashes completely unchanged", () => {
    const text = "Focus on calming redness while keeping your barrier supported today.";
    expect(sanitizeSkinDirectionText(text)).toBe(text);
  });
});
