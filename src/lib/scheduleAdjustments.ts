import type { EventTiming, ScheduleOption } from "./types";

// Maps the check-in's single-select "What's happening?" chip label
// (src/routes/scan.check-in.tsx) directly to a ScheduleOption — one chip
// selected, one option, no priority resolution needed.
export const TOMORROW_CHIP_TO_SCHEDULE_OPTION: Record<string, ScheduleOption> = {
  "Nothing special": "none",
  "Important event": "important-event",
  "Outdoor activity": "outdoor-day",
  Travel: "travel",
  "Cosmetic treatment": "cosmetic-treatment",
};

export function resolveScheduleOption(selectedChip: string | null): ScheduleOption {
  if (!selectedChip) return "none";
  return TOMORROW_CHIP_TO_SCHEDULE_OPTION[selectedChip] ?? "none";
}

// Maps the check-in's conditional single-select "When is it?" chip label to
// an EventTiming — same one-chip, one-value pattern as the type question above.
export const TIMING_CHIP_TO_EVENT_TIMING: Record<string, EventTiming> = {
  Tomorrow: "tomorrow",
  "Within 3 days": "three-days",
  "Within a week": "week",
};

export function resolveEventTiming(selectedChip: string | null): EventTiming {
  if (!selectedChip) return "none";
  return TIMING_CHIP_TO_EVENT_TIMING[selectedChip] ?? "none";
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

// How today's schedule-driven wording refers to each timing — reused by both
// the ingredient-adjustment explanation below and skinStrategyService.ts.
export const EVENT_TIMING_PHRASE: Record<Exclude<EventTiming, "none">, string> = {
  tomorrow: "tomorrow",
  "three-days": "within the next few days",
  week: "sometime this week",
};

function noteOnly(rec: AdjustableRecommendation, note: string): AdjustableRecommendation {
  return { ...rec, explanation: `${rec.explanation} ${note}`.trim() };
}

/**
 * Full strength (timing: "tomorrow") — strips strong actives out of today's
 * prioritized list (moving them to avoided, alongside the general
 * retinoid/AHA/BHA class — covers "avoid retinoids", "avoid AHA/BHA", "avoid
 * strong exfoliating treatments"), then pads back up to the original
 * prioritized count with barrier-support ingredients not already present
 * ("prioritize barrier support"/"barrier repair", "prioritize hydration" via
 * Hyaluronic Acid/Glycerin). Never adds ingredients that contradict the
 * skin-analysis baseline — it only removes risk and fills the resulting gap
 * with universally gentle basics.
 */
function favorBarrierSupportFull(
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

/**
 * Moderate strength (timing: "three-days") — same protective direction as
 * the full version (strong actives moved out of prioritized and into
 * avoided), but doesn't pad prioritized back up with barrier ingredients —
 * a lighter touch appropriate for something a few days out rather than
 * tomorrow.
 */
function favorBarrierSupportModerate(
  rec: AdjustableRecommendation,
  note: string,
): AdjustableRecommendation {
  const prioritizedIngredients = rec.prioritizedIngredients.filter((i) => !STRONG_ACTIVES.has(i));
  const movedToAvoid = rec.prioritizedIngredients.filter((i) => STRONG_ACTIVES.has(i));

  const avoidedIngredients = Array.from(
    new Set([...rec.avoidedIngredients, ...movedToAvoid, "Retinoids", "AHA", "BHA"]),
  );

  return {
    prioritizedIngredients,
    avoidedIngredients,
    explanation: `${rec.explanation} ${note}`.trim(),
  };
}

/** Timing-scaled version of the barrier-support adjustment shared by
 * "important-event", "travel", and "cosmetic-treatment": tomorrow = full,
 * three-days = moderate, week = informational note only (no ingredient
 * changes) — "how strongly" is entirely timing's job, "what to do" (barrier
 * support) is entirely the caller's job via `situation`. */
function barrierSupportForTiming(
  rec: AdjustableRecommendation,
  timing: EventTiming,
  situation: string,
): AdjustableRecommendation {
  if (timing === "none") return rec;
  const phrase = EVENT_TIMING_PHRASE[timing];
  if (timing === "tomorrow") {
    return favorBarrierSupportFull(
      rec,
      `${situation} ${phrase}, so today favors calming, barrier-supportive ingredients over new actives.`,
    );
  }
  if (timing === "three-days") {
    return favorBarrierSupportModerate(
      rec,
      `${situation} ${phrase}, so today leans toward gentler, barrier-supportive choices.`,
    );
  }
  return noteOnly(rec, `${situation} ${phrase} — keep your routine gentle as it approaches.`);
}

/** Timing-scaled sunscreen emphasis for "outdoor-day": tomorrow/three-days
 * both add Sunscreen to today's plan (there's no lighter version of "wear
 * sunscreen"); week stays informational only, matching the other types. */
function sunProtectionForTiming(
  rec: AdjustableRecommendation,
  timing: EventTiming,
): AdjustableRecommendation {
  if (timing === "none") return rec;
  const phrase = EVENT_TIMING_PHRASE[timing];
  if (timing === "week") {
    return noteOnly(
      rec,
      `You have an outdoor day ${phrase} — keep sunscreen and UV protection in mind as it approaches.`,
    );
  }
  const prioritizedIngredients = rec.prioritizedIngredients.includes("Sunscreen")
    ? rec.prioritizedIngredients
    : ["Sunscreen", ...rec.prioritizedIngredients];

  return {
    ...rec,
    prioritizedIngredients,
    explanation:
      `${rec.explanation} With an outdoor day ${phrase}, prioritize sunscreen and UV protection.`.trim(),
  };
}

/**
 * Modifies (never replaces) a skin-analysis-driven recommendation based on
 * an upcoming plan's type and timing. `option` decides the kind of
 * adjustment; `timing` decides how strongly it applies (tomorrow = full,
 * three-days = moderate, week = informational, none = baseline/no-op).
 * "none" for either field is always a no-op — there's no adjustment to make
 * without both a type and a timing.
 */
export function applyScheduleAdjustment(
  rec: AdjustableRecommendation,
  option: ScheduleOption,
  timing: EventTiming,
): AdjustableRecommendation {
  if (option === "none" || timing === "none") return rec;

  switch (option) {
    case "important-event":
      return barrierSupportForTiming(rec, timing, "You have an important event");
    case "travel":
      return barrierSupportForTiming(rec, timing, "You're traveling");
    case "cosmetic-treatment":
      return barrierSupportForTiming(rec, timing, "You have a cosmetic treatment");
    case "outdoor-day":
      return sunProtectionForTiming(rec, timing);
  }
}
