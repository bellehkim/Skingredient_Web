import { mockUser } from "@/data/mockData";
import { deriveOverallCondition } from "./overallCondition";
import { deriveSkinType } from "./skinType";
import { generateRecommendation } from "./recommendationEngine";
import { updateSkinStrategy, updateRecommendationSnapshot } from "./data/analyses";
import type { SkinStrategyInput } from "./skinStrategyService";
import type { Reaction } from "./data/ingredientReactions";
import type { DailyRecommendation, EventTiming, ScheduleOption, SkinAnalysisResult } from "./types";

export interface SkinStrategyFlowParams {
  /** Today's real, persisted analysis (must have .id) — never a stale
   * latest-ever analysis from a previous day. */
  analysis: SkinAnalysisResult;
  symptoms: string[];
  scheduleTomorrow: ScheduleOption;
  eventTiming: EventTiming;
  ingredientHistory: Record<string, Reaction>;
  irritatingCategories: Set<string>;
  irritatingIngredientNames: string[];
  /** Category-level only (e.g. "Cleanser") — never product names/brands. */
  shelfCategories: string[];
}

/**
 * Exported for testing — the input-building step is pure; the network/DB
 * calls around it are not worth mocking for unit tests (same convention as
 * skinStrategyService.ts's buildPrompt).
 *
 * `recommendation` is today's already-computed DailyRecommendation
 * (src/lib/recommendationEngine.ts) — the exact same object Today's Plan/
 * Recommended Products/Routine read. This is passed in rather than
 * recomputed here so there is exactly one recommendation per request: the
 * caller (generateAndPersistSkinStrategy below) already builds it once for
 * recommendation_snapshot, and this reuses that same value rather than an
 * independently-derived concern list (see src/lib/skinConcerns.ts's
 * doc-comment for why that was the bug).
 */
export function buildSkinStrategyInput(
  params: SkinStrategyFlowParams,
  recommendation: DailyRecommendation,
): SkinStrategyInput {
  const { analysis, scheduleTomorrow, eventTiming, shelfCategories, irritatingIngredientNames } =
    params;
  const overallCondition = deriveOverallCondition(analysis);
  return {
    scores: analysis,
    overallCondition: { score: overallCondition.score, label: overallCondition.label },
    skinType: deriveSkinType(analysis),
    direction: recommendation.displayName,
    explanation: recommendation.explanation,
    prioritizedIngredients: recommendation.prioritizedIngredients,
    avoidedIngredients: recommendation.avoidedIngredients,
    riskLevel: recommendation.riskLevel,
    scheduleTomorrow,
    eventTiming,
    shelfCategories,
    irritatingIngredients: irritatingIngredientNames,
  };
}

/**
 * The single entry point for combining today's real analysis with today's
 * Daily Check-in — called both right after a scan (when a check-in already
 * exists) and right after a check-in (when today's scan already exists).
 * Never inserts a new analysis row; always patches the existing one by id.
 *
 * One AI Skin Strategy per analysis, for the MVP — controls token usage and
 * keeps the persisted strategy from silently changing underneath the user.
 * If `analysis.skinStrategy` is already set, this deliberately does NOT call
 * Claude again; it only refreshes recommendation_snapshot, since "Today's
 * Plan" can legitimately shift with new check-in context (symptoms/schedule)
 * even though the AI paragraph itself stays fixed. There is intentionally no
 * retry/regenerate button for skin_strategy in this pass.
 *
 * Returns the updated row on any successful patch (strategy generation OR a
 * snapshot-only refresh) so the caller can immediately update appStore's
 * `analysis` — never null on success. Returns null only when nothing was
 * persisted (missing id, or a failure), in which case the caller's existing
 * state is left untouched.
 */
export async function generateAndPersistSkinStrategy(
  params: SkinStrategyFlowParams,
): Promise<SkinAnalysisResult | null> {
  const {
    analysis,
    symptoms,
    scheduleTomorrow,
    eventTiming,
    ingredientHistory,
    irritatingCategories,
  } = params;
  if (!analysis.id) return null;

  const recommendationSnapshot = generateRecommendation({
    analysis,
    symptoms,
    sensitivities: mockUser.sensitivities,
    recentActives: [],
    scheduleTomorrow,
    eventTiming,
    ingredientHistory,
    irritatingCategories,
  });

  if (analysis.skinStrategy) {
    try {
      return await updateRecommendationSnapshot(analysis.id, recommendationSnapshot);
    } catch (err) {
      console.error("Failed to refresh recommendation snapshot", err);
      return null;
    }
  }

  try {
    const strategyInput = buildSkinStrategyInput(params, recommendationSnapshot);
    const res = await fetch("/api/skin-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(strategyInput),
    });
    const body = await res.json();
    if (!res.ok || !body.skinStrategy) return null;

    return await updateSkinStrategy(analysis.id, body.skinStrategy, recommendationSnapshot);
  } catch (err) {
    console.error("Failed to generate/persist skin strategy", err);
    return null;
  }
}
