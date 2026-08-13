import type { ScheduleOption } from "./types";

// Maps the check-in's existing "What's happening tomorrow?" chip labels
// (src/routes/scan.check-in.tsx) to a ScheduleOption — reusing that UI as-is
// rather than introducing a new one.
export const TOMORROW_CHIP_TO_SCHEDULE_OPTION: Record<string, ScheduleOption> = {
  "Date or special event": "important-event",
  "Outdoor activity": "outdoor-day",
  Travel: "travel",
  "Cosmetic treatment": "cosmetic-treatment",
  "Nothing special": "none",
};

// The chip UI is multi-select; the recommendation adjustment needs one
// deterministic outcome. Highest-priority selected option wins — no
// combining, no weighting.
const PRIORITY_ORDER: ScheduleOption[] = [
  "important-event",
  "travel",
  "outdoor-day",
  "cosmetic-treatment",
  "none",
];

export function resolveScheduleOption(selectedChips: string[]): ScheduleOption {
  const options = selectedChips
    .map((chip) => TOMORROW_CHIP_TO_SCHEDULE_OPTION[chip])
    .filter((o): o is ScheduleOption => Boolean(o));
  return PRIORITY_ORDER.find((option) => options.includes(option)) ?? "none";
}

interface AdjustableRecommendation {
  prioritizedIngredients: string[];
  avoidedIngredients: string[];
  explanation: string;
}

// Ingredients recommendationEngine.ts already treats as "strong actives" —
// reused here rather than a second definition of the same concept.
const STRONG_ACTIVES = new Set([
  "Retinoids",
  "AHA",
  "BHA",
  "Salicylic Acid",
  "Azelaic Acid",
  "Glycolic Acid",
  "Gentle PHA",
  "Benzoyl Peroxide",
  "Strong Vitamin C",
]);

const BARRIER_SUPPORT_INGREDIENTS = [
  "Ceramides",
  "Panthenol",
  "Glycerin",
  "Hyaluronic Acid",
  "Centella",
];

/**
 * Shared by "important-event" and "travel": strips strong actives out of
 * today's prioritized list (moving them to avoided, alongside the general
 * retinoid/AHA/BHA class), then pads back up to the original prioritized
 * count with barrier-support ingredients not already present. Never adds
 * ingredients that contradict the skin-analysis baseline — it only removes
 * risk and fills the resulting gap with universally gentle basics.
 */
function favorBarrierSupport(
  rec: AdjustableRecommendation,
  note: string,
): AdjustableRecommendation {
  const targetLength = Math.max(rec.prioritizedIngredients.length, 2);
  const kept = rec.prioritizedIngredients.filter((i) => !STRONG_ACTIVES.has(i));
  const movedToAvoid = rec.prioritizedIngredients.filter((i) => STRONG_ACTIVES.has(i));

  const prioritizedIngredients = [...kept];
  for (const candidate of BARRIER_SUPPORT_INGREDIENTS) {
    if (prioritizedIngredients.length >= targetLength) break;
    if (!prioritizedIngredients.includes(candidate)) prioritizedIngredients.push(candidate);
  }

  const avoidedIngredients = Array.from(
    new Set([
      ...rec.avoidedIngredients,
      ...movedToAvoid,
      "Retinoids",
      "AHA",
      "BHA",
      "New active ingredients",
    ]),
  );

  return {
    prioritizedIngredients,
    avoidedIngredients,
    explanation: `${rec.explanation} ${note}`.trim(),
  };
}

function emphasizeSunProtection(rec: AdjustableRecommendation): AdjustableRecommendation {
  const prioritizedIngredients = rec.prioritizedIngredients.includes("Sunscreen")
    ? rec.prioritizedIngredients
    : ["Sunscreen", ...rec.prioritizedIngredients];

  return {
    ...rec,
    prioritizedIngredients,
    explanation:
      `${rec.explanation} With an outdoor day tomorrow, prioritize sunscreen and UV protection.`.trim(),
  };
}

/**
 * Modifies (never replaces) a skin-analysis-driven recommendation based on
 * tomorrow's schedule context. "cosmetic-treatment" and "none" are no-ops
 * for the MVP — the baseline passes through unchanged.
 */
export function applyScheduleAdjustment(
  rec: AdjustableRecommendation,
  option: ScheduleOption,
): AdjustableRecommendation {
  switch (option) {
    case "important-event":
      return favorBarrierSupport(
        rec,
        "You have an important event tomorrow, so today favors calming, barrier-supportive ingredients over new actives.",
      );
    case "travel":
      return favorBarrierSupport(
        rec,
        "You're traveling tomorrow, so today keeps things simple with barrier-supportive basics.",
      );
    case "outdoor-day":
      return emphasizeSunProtection(rec);
    case "cosmetic-treatment":
    case "none":
      return rec;
  }
}
