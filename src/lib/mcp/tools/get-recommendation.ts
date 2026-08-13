import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { generateRecommendation } from "@/lib/recommendationEngine";
import type { SkinAnalysisResult } from "@/lib/types";

const metric = z.number().min(0).max(100).describe("0-100 score from the daily skin analysis.");

export default defineTool({
  name: "get_recommendation",
  title: "Get a daily skin recommendation",
  description:
    "Run Skingredient's deterministic recommendation engine for a given skin analysis and context. Returns the recommended direction (e.g. barrier-recovery), prioritized ingredients, and ingredients to avoid today.",
  inputSchema: {
    redness: metric,
    hydration: metric,
    oiliness: metric,
    acne: metric,
    pores: metric,
    texture: metric,
    ageSpots: metric,
    symptoms: z
      .array(z.string())
      .optional()
      .describe("Reported symptoms today, e.g. ['stinging', 'burning']."),
    sensitivities: z
      .array(z.string())
      .optional()
      .describe("Known sensitivities to filter from prioritized ingredients."),
    eventType: z
      .enum(["important-event", "outdoor-day", "travel", "cosmetic-treatment", "none"])
      .optional()
      .describe("Kind of any upcoming plan that should influence today's plan."),
    eventTiming: z
      .enum(["tomorrow", "three-days", "week", "none"])
      .optional()
      .describe(
        "Timing of the upcoming plan — how strongly it adjusts today's plan (tomorrow = strongest).",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({
    redness,
    hydration,
    oiliness,
    acne,
    pores,
    texture,
    ageSpots,
    symptoms,
    sensitivities,
    eventType,
    eventTiming,
  }) => {
    const analysis: SkinAnalysisResult = {
      redness,
      hydration,
      oiliness,
      acne,
      pores,
      texture,
      ageSpots,
      analyzedAt: new Date().toISOString(),
    };
    const rec = generateRecommendation({
      analysis,
      symptoms: symptoms ?? [],
      sensitivities: sensitivities ?? [],
      recentActives: [],
      scheduleTomorrow: eventType,
      eventTiming,
    });
    return {
      content: [
        {
          type: "text",
          text: `${rec.displayName} (risk: ${rec.riskLevel})\n${rec.explanation}\nPrioritize: ${rec.prioritizedIngredients.join(", ") || "-"}\nAvoid: ${rec.avoidedIngredients.join(", ") || "-"}`,
        },
      ],
      structuredContent: { recommendation: rec },
    };
  },
});
