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
    eventTiming: z
      .enum(["tomorrow", "three-days", "week", "none"])
      .optional()
      .describe("Timing of any upcoming event that should influence today's plan."),
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
      upcomingEvent:
        eventTiming && eventTiming !== "none" ? { type: "event", timing: eventTiming } : undefined,
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
