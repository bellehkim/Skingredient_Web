import type { DailyRecommendation, RecommendationInput, SkinDirection } from "./types";
import { applyScheduleAdjustment } from "./scheduleAdjustments";
import { categoryDisplayName, categoryForLabel } from "./productMatching";

const DISPLAY: Record<SkinDirection, string> = {
  "barrier-recovery": "Barrier Recovery",
  "blemish-control": "Blemish Control",
  "hydration-support": "Hydration Support",
  "oil-balance": "Oil Balance",
  "texture-renewal": "Texture Renewal",
  "pause-actives": "Pause Actives",
  maintenance: "Healthy Maintenance",
};

const SEVERE_SYMPTOMS = ["burning", "swelling", "severe-itching", "rash"];

// Healthy/Maintenance fallback — the starting point below, used whenever no
// concern branch matches. Deliberately gentle, barrier-supportive ingredients
// only (never a strong active by default), so a healthy scan still produces
// a real, non-empty plan for Recommended Products/Routine/AI Skin Strategy
// to agree on, instead of an empty PRIORITIZE with nothing to build on.
const MAINTENANCE_PRIORITIZED = [
  "Glycerin",
  "Hyaluronic Acid",
  "Ceramides",
  "Panthenol",
  "Squalane",
];
const MAINTENANCE_EXPLANATION =
  "Your skin looks healthy today — a consistent, barrier-supportive routine is all it needs.";

export function generateRecommendation(input: RecommendationInput): DailyRecommendation {
  const { analysis, symptoms, sensitivities, scheduleTomorrow, eventTiming, irritatingCategories } =
    input;
  const severe = symptoms.some((s) => SEVERE_SYMPTOMS.includes(s));

  let direction: SkinDirection = "maintenance";
  let prioritized: string[] = [...MAINTENANCE_PRIORITIZED];
  let avoided: string[] = [];
  let risk: "low" | "moderate" | "high" = "low";
  let explanation = MAINTENANCE_EXPLANATION;

  if (severe) {
    direction = "pause-actives";
    prioritized = ["Ceramides", "Panthenol", "Glycerin", "Squalane"];
    avoided = ["Retinoids", "AHA", "BHA", "Benzoyl Peroxide", "Strong Vitamin C", "Fragrance"];
    risk = "high";
    explanation =
      "Your skin looks highly reactive. Pausing strong actives and focusing on gentle barrier support.";
  } else if (analysis.redness <= 35 && analysis.hydration <= 55) {
    direction = "barrier-recovery";
    prioritized = ["Ceramides", "Panthenol", "Glycerin", "Beta-Glucan", "Squalane"];
    avoided = ["Retinoids", "AHA", "BHA", "Benzoyl Peroxide", "Strong Vitamin C"];
    risk = "moderate";
    explanation = "Your skin looks dehydrated and slightly reactive today.";
  } else if (analysis.acne <= 35) {
    // Acne alone doesn't rule out a barrier problem — when hydration is also
    // reduced (same threshold the barrier-recovery branch above uses), add
    // 1-2 barrier ingredients so Today's Plan doesn't ignore it, and stop
    // blanket-avoiding occlusives: they support barrier repair and aren't a
    // real acne risk on their own (only stacking multiple actives is).
    const alsoNeedsBarrierSupport = analysis.hydration <= 55;
    direction = "blemish-control";
    prioritized = alsoNeedsBarrierSupport
      ? ["Salicylic Acid", "Azelaic Acid", "Niacinamide", "Ceramides", "Panthenol"]
      : ["Salicylic Acid", "Azelaic Acid", "Niacinamide"];
    avoided = alsoNeedsBarrierSupport
      ? ["Multiple exfoliating actives at once"]
      : ["Multiple exfoliating actives at once", "Heavy occlusives"];
    risk = "moderate";
    explanation = alsoNeedsBarrierSupport
      ? "Focus on gentle blemish control while also supporting your barrier, since hydration is reduced too."
      : "Focus on gentle blemish control without overloading actives.";
  } else if (analysis.hydration <= 45) {
    direction = "hydration-support";
    prioritized = ["Glycerin", "Hyaluronic Acid", "Beta-Glucan", "Panthenol"];
    avoided = ["Alcohol", "Strong exfoliants"];
    risk = "low";
    explanation = "Your skin needs a hydration boost today.";
  } else if (analysis.oiliness <= 30 && analysis.hydration > 45) {
    direction = "oil-balance";
    prioritized = ["Niacinamide", "Lightweight hydrators"];
    avoided = ["Heavy occlusives"];
    risk = "low";
    explanation = "Balance oil without over-drying your skin.";
  } else if (analysis.texture <= 35) {
    direction = "texture-renewal";
    prioritized = ["Gentle PHA", "Niacinamide"];
    avoided = ["Combining multiple strong exfoliants"];
    risk = "moderate";
    explanation = "A gentle, controlled exfoliation plan can help refine texture.";
  }

  // Tomorrow's schedule context (src/routes/scan.check-in.tsx) modifies the
  // skin-analysis baseline above — it never overrides it, and is skipped for
  // "pause-actives" days since that direction already avoids everything strong.
  if (risk !== "high" && scheduleTomorrow) {
    const adjusted = applyScheduleAdjustment(
      { prioritizedIngredients: prioritized, avoidedIngredients: avoided, explanation },
      scheduleTomorrow,
      eventTiming ?? "none",
    );
    prioritized = adjusted.prioritizedIngredients;
    avoided = adjusted.avoidedIngredients;
    explanation = adjusted.explanation;
  }

  // Bridge a reported-irritating exact ingredient to its functional_category
  // (src/lib/data/ingredientReactions.ts), not by comparing the raw ingredient
  // name against these category labels directly — that was the old bug (e.g.
  // "Retinol" reported irritating never matched the "Retinoids" label here).
  // Moving the label to avoided (rather than just dropping it) surfaces it in
  // "Avoid Today" — a conservative category-level UI signal, not a claim that
  // every ingredient in the family is unsafe.
  if (irritatingCategories && irritatingCategories.size > 0) {
    const stillPrioritized: string[] = [];
    for (const label of prioritized) {
      const category = categoryForLabel(label);
      if (category && irritatingCategories.has(category)) {
        const displayName = categoryDisplayName(category);
        if (!avoided.includes(displayName)) avoided = [...avoided, displayName];
      } else {
        stillPrioritized.push(label);
      }
    }
    prioritized = stillPrioritized;
  }

  const lowerSens = sensitivities.map((s) => s.toLowerCase());
  prioritized = prioritized.filter((i) => !lowerSens.includes(i.toLowerCase()));

  // Final conflict resolution, run once, authoritatively, after every other
  // adjustment (baseline branch, schedule, reaction/sensitivity) — AVOID
  // always wins over PRIORITIZE, whichever stage introduced the conflict.
  // Every downstream surface (Today's Plan, Recommended Products, Shelf
  // status, Routine, AI Skin Strategy) reads this same resolved list; none
  // of them should re-resolve conflicts on their own.
  prioritized = resolveAvoidPriorityConflicts(prioritized, avoided);

  return {
    direction,
    displayName: DISPLAY[direction],
    explanation: explanation.trim(),
    prioritizedIngredients: prioritized,
    avoidedIngredients: avoided,
    riskLevel: risk,
  };
}

/**
 * Exported for testing — drops any prioritized ingredient that conflicts
 * with something avoided, either an exact match (e.g. avoiding "Retinoids"
 * while also somehow still prioritizing "Retinoids") or a shared
 * functional_category (e.g. prioritizing "Salicylic Acid" while avoiding
 * "BHA" — both map to the "salicylic_acid" category via productMatching.ts's
 * exact label bridge, no fuzzy matching). Never removes a prioritized
 * ingredient that isn't actually related to anything avoided.
 */
export function resolveAvoidPriorityConflicts(prioritized: string[], avoided: string[]): string[] {
  const avoidedLower = new Set(avoided.map((a) => a.toLowerCase()));
  const avoidedCategories = new Set(
    avoided.map((a) => categoryForLabel(a)).filter((c): c is string => Boolean(c)),
  );

  return prioritized.filter((label) => {
    if (avoidedLower.has(label.toLowerCase())) return false;
    const category = categoryForLabel(label);
    return !(category && avoidedCategories.has(category));
  });
}
